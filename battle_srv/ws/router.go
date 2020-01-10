package ws

import (
	"encoding/json"
	"reflect"
	. "server/common"

	"go.uber.org/zap"
)

type wsHandleInfo struct {
	reqType reflect.Type
	respAct string
}

type wsReq struct {
	MsgId int             `json:"msgId"`
	Act   string          `json:"act"`
	Data  json.RawMessage `json:"data"`
}

type wsResp struct {
	Ret   int64       `json:"ret"`
	MsgId int         `json:"echoedMsgId"`
	Act   string      `json:"act"`
	Data  interface{} `json:"data"`
}

type wsHandler interface {
	handle(*Session, *wsResp) error
}

var wsRouter = make(map[string]*wsHandleInfo, 50)

func regHandleInfo(reqAct string, info *wsHandleInfo) {
	wsRouter[reqAct] = info
}

func wsHandle(session *Session, req *wsReq) *wsResp {
	var body interface{}
	resp := &wsResp{
		MsgId: req.MsgId,
	}
	info, exists := wsRouter[req.Act]
	if !exists {
		resp.Ret = Constants.RetCode.NonexistentAct
		return resp
	}
	body = reflect.New(info.reqType).Interface()
	err := json.Unmarshal(req.Data, &body)
	if err != nil {
		Logger.Warn("json.Unmarshal", zap.Error(err))
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return resp
	}
	h, ok := body.(wsHandler)
	if !ok {
		resp.Ret = Constants.RetCode.NonexistentAct
		return resp
	}
	resp.Act = info.respAct
	err = h.handle(session, resp)
	if err != nil {
		Logger.Error("ws handle", zap.Error(err))
		if resp.Ret == 0 {
			resp.Ret = Constants.RetCode.UnknownError
		}
	}
	return resp
}

func wsSend(s *Session, act string, data interface{}) {
	resp := &wsResp{
		Act:  act,
		Data: data,
		Ret:  Constants.RetCode.Ok,
	}
	err := s.Send(resp)
	if err != nil {
		Logger.Debug("write:", zap.Error(err))
	}
}
