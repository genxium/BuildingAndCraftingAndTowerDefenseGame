package ws

import (
	"fmt"
	"net/http"
	"runtime/debug"
	. "server/common"
	"server/models"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	READ_BUF_SIZE  = 8 * 1024
	WRITE_BUF_SIZE = 8 * 1024
	SEND_CHAN_SIZE = 128
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  READ_BUF_SIZE,
	WriteBufferSize: WRITE_BUF_SIZE,
	CheckOrigin: func(r *http.Request) bool {
		Logger.Debug("origin", zap.Any("origin", r.Header.Get("Origin")))
		return true
	},
}
var wsConnManager = NewManager()

func startOrFeedHeartbeatWatchdog(conn *websocket.Conn) bool {
	if nil == conn {
		return false
	}
	conn.SetReadDeadline(time.Now().Add(time.Millisecond * (ConstVals.Ws.WillKickIfInactiveFor)))
	return true
}

func Serve(c *gin.Context) {
	token, ok := c.GetQuery("intAuthToken")
	if !ok {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	// TODO: Wrap the following 2 stmts by sql transaction!
	playerId, err := models.GetPlayerIdByToken(token)
	if err != nil || playerId == 0 {
		// TODO: Abort with specific message.
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	Logger.Info("PlayerLogin record has been found for ws authentication:", zap.Any("playerId", playerId))

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		Logger.Error("upgrade:", zap.Error(err), zap.Any("playerId", playerId))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	Logger.Debug("ConstVals.Ws.WillKickIfInactiveFor", zap.Duration("v", ConstVals.Ws.WillKickIfInactiveFor))

	/**
	 * WARNING: After successfully upgraded to use the "persistent connection" of http1.1/websocket protocol, you CANNOT overwrite the http1.0 resp status by `c.AbortWithStatus(...)` any more!
	 */
	connHasBeenSignaledToClose := int32(0)
	pConnHasBeenSignaledToClose := &connHasBeenSignaledToClose

	signalToCloseConnOfThisPlayer := func(customRetCode int64, customRetMsg string) {
		if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 0, 1); !swapped {
			return
		}
		Logger.Warn("signalToCloseConnOfThisPlayer:", zap.Any("playerId", playerId), zap.Any("customRetCode", customRetCode), zap.Any("customRetMsg", customRetMsg))
		defer func() {
			if r := recover(); r != nil {
				Logger.Warn("Recovered from: ", zap.Any("panic", r))
			}
		}()
		/**
		 * References
		 * - https://tools.ietf.org/html/rfc6455
		 * - https://godoc.org/github.com/gorilla/websocket#hdr-Control_Messages
		 * - https://godoc.org/github.com/gorilla/websocket#FormatCloseMessage
		 * - https://godoc.org/github.com/gorilla/websocket#Conn.WriteControl
		 * - https://godoc.org/github.com/gorilla/websocket#hdr-Concurrency
		 *   - "The Close and WriteControl methods can be called concurrently with all other methods."
		 */

		/**
		 * References for the "WebsocketStdCloseCode"s. Note that we're using some "CustomCloseCode"s here as well.
		 *
		 * - https://tools.ietf.org/html/rfc6455#section-7.4
		 * - https://godoc.org/github.com/gorilla/websocket#pkg-constants.
		 */
		closeMessage := websocket.FormatCloseMessage(int(customRetCode), customRetMsg)
		err := conn.WriteControl(websocket.CloseMessage, closeMessage, time.Now().Add(time.Millisecond*(ConstVals.Ws.WillKickIfInactiveFor)))
		if err != nil {
			Logger.Error("Unable to send the CloseFrame control message to player(client-side):", zap.Any("playerId", playerId), zap.Error(err))
		}
	}

	onReceivedCloseMessageFromClient := func(code int, text string) error {
		Logger.Warn("Triggered `onReceivedCloseMessageFromClient`:", zap.Any("code", code), zap.Any("playerId", playerId), zap.Any("message", text))
		signalToCloseConnOfThisPlayer(int64(code), text)
		return nil
	}

	/**
	 * - "SetCloseHandler sets the handler for close messages received from the peer."
	 *
	 * - "The default close handler sends a close message back to the peer."
	 *
	 * - "The connection read methods return a CloseError when a close message is received. Most applications should handle close messages as part of their normal error handling. Applications should only set a close handler when the application must perform some action before sending a close message back to the peer."
	 *
	 * from reference https://godoc.org/github.com/gorilla/websocket#Conn.SetCloseHandler.
	 */
	conn.SetCloseHandler(onReceivedCloseMessageFromClient)

	//TODO add trx
	player, err := models.GetPlayerById(playerId, nil)
	if err != nil || player == nil {
		// TODO: Abort with specific message.
		signalToCloseConnOfThisPlayer(Constants.RetCode.InvalidRequestParam, "")
	}

	Logger.Info("Player has logged in and its profile is found from persistent storage:", zap.Any("playerId", playerId), zap.Any("play", player))

	if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 1, 1); swapped {
		return
	}

	session := wsConnManager.NewSession(playerId, conn, SEND_CHAN_SIZE)
	wsConnManager.Debug()

	resp := wsResp{
		Ret:   Constants.RetCode.Ok,
		MsgId: 0,
		Act:   "HeartbeatRequirements",
		Data: struct {
			IntervalToPing        int64 `json:"intervalToPing"`
			WillKickIfInactiveFor int64 `json:"willKickIfInactiveFor"`
		}{Constants.Ws.IntervalToPing, Constants.Ws.WillKickIfInactiveFor},
	}

	var connIOMux sync.RWMutex
	connIOMux.Lock()
	err = conn.WriteJSON(resp)
	connIOMux.Unlock()
	//session.Send(resp)

	if err != nil {
		Logger.Error("HeartbeatRequirements resp not written:", zap.Any("playerId", playerId), zap.Error(err))
		signalToCloseConnOfThisPlayer(Constants.RetCode.UnknownError, fmt.Sprintf("HeartbeatRequirements resp not written to playerId == %v!", playerId))
	}

	// Starts the receiving loop against the client-side
	receivingLoopAgainstPlayer := func() error {
		defer func() {
			if r := recover(); r != nil {
				debug.PrintStack()
				Logger.Warn("Goroutine `receivingLoopAgainstPlayer`, recovery spot#1, recovered from: ", zap.Any("panic", r))
			}
		}()
		for {
			if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 1, 1); swapped {
				return nil
			}
			conn.SetReadDeadline(time.Now().Add(ConstVals.Ws.WillKickIfInactiveFor))
			message, err := session.Receive()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure) {
					Logger.Debug("read:", zap.Error(err))
				}
				break
			}
			if message.(*wsReq).Act != "HeartbeatPing" {
				Logger.Debug("recv:", zap.Any("msg", message))
			}
			resp := wsHandle(session, message.(*wsReq))
			err = session.Send(resp)
			if err != nil {
				Logger.Debug("write:", zap.Error(err))
				break
			}
		}
		return nil
	}
	startOrFeedHeartbeatWatchdog(conn)
	go receivingLoopAgainstPlayer()
}
