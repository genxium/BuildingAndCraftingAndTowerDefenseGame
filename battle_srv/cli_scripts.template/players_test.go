package cli_scripts

import (
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	_ "github.com/go-sql-driver/mysql"
	"github.com/golang/protobuf/proto"
	"github.com/gorilla/websocket"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	. "server/common"
	"server/common/utils"
	"server/models"
	pb "server/pb_output"
	"strconv"
	"sync"
	"testing"
	"time"
)

var wsEndPoint string
var willCancel string
var willCollect string

var GameServerHostAndPath string

type KeyActionStepGeneral func(intAuthToken string)
type KeyActionStepSmsCaptchaLogin func(phoneCountryCode string, phoneNum string, smsLoginCaptcha string, thirdStep KeyActionStepGeneral)
type KeyActionStepSmsCaptchaObtain func(phoneCountryCode string, phoneNum string, secondStep KeyActionStepSmsCaptchaLogin, thirdStep KeyActionStepGeneral)

var commonSecondStep KeyActionStepSmsCaptchaLogin
var commonFirstStep KeyActionStepSmsCaptchaObtain

type upsyncRespType struct {
	Ret                                int64   `json:"ret"`
	SyncData                           string  `json:"syncData"`
	ReqSeqNum                          int64   `json:"reqSeqNum"`
	ShouldRefreshMissionList           bool    `json:"shouldRefreshMissionList"`
	NewlyClaimedIngredientProgressList []int32 `json:"newlyClaimedIngredientProgressList"`
}

type playerBuildableListQueryRespType struct {
	Ret                                     int                                  `json:"ret"`
	ReqSeqNum                               int                                  `json:"reqSeqNum"`
	SyncData                                string                               `json:"syncData"`
	UnclaimedPlayerMissionBindingList       []int32                              `json:"unclaimedPlayerMissionBindingList"`
	UnclaimedLegalCurrencyPaymentRecordList []*models.LegalCurrencyPaymentRecord `json:"unclaimedLegalCurrencyPaymentRecordList"`
	IngredientProgressList                  []*models.IngredientProgress         `json:"ingredientProgressList"`
}

type knapsackQueryRespType struct {
	Ret                    int64                        `json:"ret"`
	ReqSeqNum              int64                        `json:"reqSeqNum"`
	TargetPage             int64                        `json:"targetPage"`
	CountPerPage           int                          `json:"countPerPage"`
	TotalCount             int                          `json:"totalCount"`
	KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
	IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
}

type produceRespType struct {
	Ret                    int                          `json:"ret"`
	ReqSeqNum              int                          `json:"reqSeqNum"`
	IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
}

type cancelRespType struct {
	Ret                    int                          `json:"ret"`
	ReqSeqNum              int                          `json:"reqSeqNum"`
	IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
	KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
}

type boostRespType struct {
	Ret                    int                          `json:"ret"`
	ReqSeqNum              int                          `json:"reqSeqNum"`
	IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
	KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
}

type synthesizeRespType struct {
	Ret                        int                          `json:"ret"`
	ReqSeqNum                  int                          `json:"reqSeqNum"`
	ResultedIngredientProgress *models.IngredientProgress   `json:"resultedIngredientProgress"`
	IngredientProgressList     []*models.IngredientProgress `json:"ingredientProgressList"`
}

type collectRespType struct {
	Ret                    int                          `json:"ret"`
	ReqSeqNum              int                          `json:"reqSeqNum"`
	IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
	KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
}

type reclaimRespType struct {
	Ret                        int64                        `json:"ret"`
	ReqSeqNum                  int64                        `json:"reqSeqNum"`
	IngredientProgressList     []*models.IngredientProgress `json:"ingredientProgressList"`
	ResultedIngredientProgress *models.IngredientProgress   `json:"resultedIngredientProgress"`
	KnapsackRecordList         []*models.Knapsack           `json:"knapsack"`
}

func _queryKnapsack(chosenTesterName string, intAuthToken string, protocol string, hostAndPort string) knapsackQueryRespType {
	knapsackQueryReqForm := make(url.Values)
	knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
	knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
	knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
	knapsackQueryPath := "/api/v1/Player/Knapsack/Query"
	knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
	if nil != err {
		panic(err)
	}
	defer knapsackQueryResp.Body.Close()
	knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
	if nil != err {
		Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
		panic(err)
	}
	var knapsackQueryRespStructIns knapsackQueryRespType
	err = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
	if nil != err {
		Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
		panic(err)
	}
	return knapsackQueryRespStructIns
}

func _cancelIngredientProgress(chosenTesterName string, intAuthToken string, protocol string, hostAndPort string, targetedIngredientProgressId int32, useManualCollect string) cancelRespType {
	Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgressId", targetedIngredientProgressId))
	cancelReqForm := make(url.Values)
	cancelReqForm["intAuthToken"] = []string{intAuthToken}
	cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
	cancelReqForm["autoCollect"] = []string{useManualCollect}
	cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgressId), 10)}
	cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
	cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
	defer cancelResp.Body.Close()
	cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
	if nil != err {
		fmt.Printf("Error occurs when reading response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
		panic(err)
	}
	var cancelRespStructIns cancelRespType
	err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
	if nil != err {
		fmt.Printf("Error occurs when unmarshaling the response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
		panic(err)
	}

	return cancelRespStructIns
}

/**
* This function `init()` will be automatically executed by `go test`.
 */
func init() {
	GameServerHostAndPath = "localhost"

	MustParseConfig()
	MustParseConstants()

	flag.StringVar(&willCancel, "cancel", "false", "To execute `/IngredientProgress/Cancel` API or not.")
	flag.StringVar(&willCollect, "collect", "false", "To execute `/PlayerBuildableBinding/Ingredient/Collect` API or not.")
	flag.StringVar(&wsEndPoint, "wsEndPoint", fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port), "Default is `localhost:9992`.")
	flag.Parse()

	Logger.Info("Cmd args", zap.Any("willCancel", willCancel), zap.Any("willCollect", willCollect), zap.Any("wsEndPoint", wsEndPoint))

	commonSecondStep = func(phoneCountryCode string, phoneNum string, smsLoginCaptcha string, fn KeyActionStepGeneral) {
		type respType struct {
			Ret             int    `json:"ret"`
			IntAuthToken    string `json:"intAuthToken"`
			SmsLoginCaptcha string `json:"smsLoginCaptcha"`
		}
		var obtainedIntAuthToken string
		obtainedIntAuthToken = ""
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("Recovered from: %v\n", r)
			}
			fn(obtainedIntAuthToken)
		}()

		reqForm := make(url.Values)
		reqForm["phoneCountryCode"] = []string{phoneCountryCode}
		reqForm["phoneNum"] = []string{phoneNum}
		reqForm["smsLoginCaptcha"] = []string{smsLoginCaptcha}
		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/SmsCaptcha/Login"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			fmt.Printf("Error occurs when calling SmsCaptchaLogin for player %s, resp == %v, err == %v.\n", phoneNum, resp, err)
			panic(err)
		}
		defer resp.Body.Close()
		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			fmt.Printf("Error occurs when reading response body from SmsCaptchaLogin API for player %s, resp == %v, err == %v.\n", phoneNum, resp, err)
			panic(err)
		}
		var respStructIns respType
		err = json.Unmarshal(respBody, &respStructIns)
		if nil != err {
			fmt.Printf("Error occurs when unmarshaling the response body from SmsCaptchaLogin API for player %s, resp == %v, err == %v.\n", phoneNum, resp, err)
			panic(err)
		}
		fmt.Printf("For player %s%s, respStructIns.Ret == %v, respStructIns.IntAuthToken == %v.\n", phoneNum, smsLoginCaptcha, respStructIns.Ret, respStructIns.IntAuthToken)
		obtainedIntAuthToken = respStructIns.IntAuthToken
	}

	commonFirstStep = func(phoneCountryCode string, testerName string, secondStep KeyActionStepSmsCaptchaLogin, thirdStep KeyActionStepGeneral) {
		type respType struct {
			Ret             int    `json:"ret"`
			SmsLoginCaptcha string `json:"smsLoginCaptcha"`
		}
		var obtainedSmsCaptcha string
		obtainedSmsCaptcha = ""
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("Recovered from: %v\n", r)
			}
			secondStep(phoneCountryCode, testerName, obtainedSmsCaptcha, thirdStep)
		}()

		fmt.Printf("About to obtain SmsCaptcha by %s.\n", testerName)

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/SmsCaptcha/Obtain"

		req, err := http.NewRequest("GET", fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), nil)
		if nil != err {
			fmt.Printf("Error occurs when obtaining SmsCaptcha for player %s, req == %v, err == %v.\n", testerName, req, err)
			panic(err)
		}

		q := req.URL.Query()
		q.Add("phoneCountryCode", phoneCountryCode)
		q.Add("phoneNum", testerName)
		req.URL.RawQuery = q.Encode()

		client := &http.Client{}
		resp, err := client.Do(req)
		if nil != err {
			fmt.Printf("Error occurs when obtaining SmsCaptcha for player %s, resp == %v, err == %v.\n", testerName, resp, err)
			panic(err)
		}

		defer resp.Body.Close()
		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			fmt.Printf("Error occurs when reading response body from SmsCaptchaObtain API for player %s, resp == %v, err == %v.\n", testerName, resp, err)
			panic(err)
		}
		var respStructIns respType
		err = json.Unmarshal(respBody, &respStructIns)
		if nil != err {
			fmt.Printf("Error occurs when unmarshaling the response body from SmsCaptchaObtain API for player %s, resp == %v, err == %v.\n", testerName, resp, err)
			panic(err)
		}
		fmt.Printf("For player %s, respStructIns.Ret == %v, respStructIns.SmsLoginCaptcha == %v.\n", testerName, respStructIns.Ret, respStructIns.SmsLoginCaptcha)
		obtainedSmsCaptcha = respStructIns.SmsLoginCaptcha
	}
}

func Test_DeletePlayer(t *testing.T) {
	var playerIds []int32

	Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
	db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
	if err != nil {
		t.Error("connect to mysql fails", err)
	}
	tx := db.MustBegin()
	defer tx.Rollback()

	query, args, err := sq.Select("id").
		From("player").
		OrderBy("id asc").
		ToSql()
	if err != nil {
		t.FailNow()
	}

	err = tx.Select(&playerIds, query, args...)
	if err != nil {
		t.Error("get player fails ", err)
		t.FailNow()
	}
	Logger.Info("PlayerIds: ", zap.Any("array", playerIds))
	for i, _ := range playerIds {
		playerId := playerIds[i]
		// Delete player_bulk_sync_data.
		query, args, err := sq.Delete("player_bulk_sync_data").
			Where(sq.Eq{"player_id": playerId}).ToSql()
		if err != nil {
			t.Error("delete player_bulk_sync_data to sql fails", err)
			t.FailNow()
		}

		result, err := tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player_bulk_sync_data fails ", err)
			t.FailNow()
		}
		rowsAffected, err := result.RowsAffected()
		Logger.Info("delete player_bulk_sync_data ", zap.Int64("affected rows == ", rowsAffected))

		// Delete player_mission_binding.
		query, args, err = sq.Delete("player_mission_binding").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player_mission_binding to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player_mission_binding fails ", err)
			t.FailNow()
		}
		// Delete player_quest_binding.
		query, args, err = sq.Delete("player_quest_binding").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player_quest_binding to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player_quest_binding fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player_quest_binding ", zap.Int64("affected rows == ", rowsAffected))

		// Delete player.
		query, args, err = sq.Delete("player").
			Where(sq.Eq{"id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player", zap.Int64("affected rows == ", rowsAffected))

		// Delete player_login.
		query, args, err = sq.Delete("player_login").
			Where(sq.Eq{}).ToSql()

		if err != nil {
			t.Error("delete player_login to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player_login fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player_login", zap.Int64("affected rows == ", rowsAffected))

		// Delete player_auth_binding.
		query, args, err = sq.Delete("player_auth_binding").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player_auth_binding to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player_auth_binding fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player_auth_binding", zap.Int64("affected rows == ", rowsAffected))

		// Delete knapsack.
		query, args, err = sq.Delete("knapsack").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete knapsack to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete knapsack fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete knapsack", zap.Int64("affected rows == ", rowsAffected))

		// Delete ingredient progress.
		query, args, err = sq.Delete("ingredient_progress").
			Where(sq.Eq{"owner_player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete ingredient progress to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete ingredient progress fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete ingredient progress", zap.Int64("affected rows == ", rowsAffected))

		// Delete player recipe
		query, args, err = sq.Delete("player_recipe").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player recipe to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player recipe fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player recipe", zap.Int64("affected rows == ", rowsAffected))

		// Delete player stage binding
		query, args, err = sq.Delete("player_stage_binding").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if err != nil {
			t.Error("delete player stage binding to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if err != nil {
			t.Error("delete player stage binding fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player stage binding", zap.Int64("affected rows == ", rowsAffected))
	}
	err = tx.Commit()
	if err != nil {
		t.Error("commit fails", err)
		t.FailNow()
	}
}

func Test_InitKnapsack(t *testing.T) {
	chosenTesterNameList := []string{"add", "bdd", "cdd", "ddd", "edd", "mdd", "pdd"}
	var playerIds []int32

	Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
	db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
	if err != nil {
		t.Error("connect to mysql fails", err)
	}
	tx := db.MustBegin()
	defer tx.Rollback()

	query, args, err := sqlx.In("SELECT id FROM player WHERE name IN (?) AND deleted_at IS NULL", chosenTesterNameList)
	if err != nil {
		t.FailNow()
	}
	query = tx.Rebind(query)
	if nil != err {
		t.FailNow()
	}

	err = tx.Select(&playerIds, query, args...)
	if nil != err {
		t.Error("get player fails ", err)
		t.FailNow()
	}
	Logger.Info("PlayerIds: ", zap.Any("array", playerIds))
	for i, _ := range playerIds {
		playerId := playerIds[i]

		// Delete knapsack first.
		query, args, err = sq.Delete("knapsack").
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete knapsack to sql fails", err)
			t.FailNow()
		}
		result, err := tx.Exec(query, args...)
		if nil != err {
			t.Error("delete knapsack fails ", err)
			t.FailNow()
		}

		rowsAffected, err := result.RowsAffected()
		Logger.Info("delete knapsack", zap.Int64("affected rows == ", rowsAffected))

		// Initialize the knapsack again.
		toInitIngredientIdList := []int32{1, 2, 3, 4, 5, 6, 7, 8, 9}
		toInitIngredientCountList := []int32{10, 99, 13, 100, 256, 256, 256, 256, 233}
		for idx, toInitIngredientId := range toInitIngredientIdList {
			increCount := toInitIngredientCountList[idx]
			rowsAffected, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, playerId)
			if nil != localErr {
				t.FailNow()
			}
			if 0 < rowsAffected {
				// Deliberately left blank.
			}
		}
	}
	err = tx.Commit()
	if nil != err {
		t.Error("commit fails", err)
		t.FailNow()
	}
}

func Test_SmsCaptchaLogin(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		theWaitGroup.Done()
	}

	fixedCountryCode := "86"  // Temporarily hardcoded.
	chosenTesterName := "add" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_WsConnectAttackFirstVictim(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		defer func() {
			theWaitGroup.Done()
		}()
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		} else {
			// The WsEndPoint Path literal is specified in `<proj-root>/battle_srv/main.go`.
			u := url.URL{Scheme: "ws", Host: wsEndPoint, Path: "/cuisineconn"}
			q := u.Query()
			q.Set("intAuthToken", intAuthToken)
			u.RawQuery = q.Encode()
			fmt.Println("Connecting to", u.String())

			c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
			if err != nil {
				fmt.Println("Error dialing:", err)
			}
			defer c.Close()

			done := make(chan struct{})

			theWaitGroup.Add(1)
			go func() {
				defer func() {
					fmt.Println("The ws message receiving routine is stopped.")
					close(done)
					theWaitGroup.Done()
				}()
				for {
					_, message, err := c.ReadMessage()
					if err != nil {
						fmt.Println("Error reading from remote:", err)
						return
					}
					fmt.Println("Received message from remote:", message)
				}
			}() // Detached from the current Goroutine and controlled by "chan `done`".

			interrupt := make(chan os.Signal, 1)
			signal.Notify(interrupt, os.Interrupt)

			for {
				select {
				case <-done:
					return
				case <-interrupt:
					fmt.Println("Interruptted manually.")

					// Cleanly close the connection by sending a close message and then
					// waiting (with timeout) for the server to close the connection.
					err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
					if err != nil {
						fmt.Println("Error sending a manual close:", err)
						return
					}
					select {
					case <-done:
					}
					return
				}
			}
		}
	}

	fixedCountryCode := "86"  // Temporarily hardcoded.
	chosenTesterName := "add" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_WsConnectTerminateFirstAttack(t *testing.T) {
	// TBD.
}

func Test_GenerateEncodeStr(t *testing.T) {
	playerBuildable := pb.PlayerBuildableBinding{
		PlayerId: 95,
		Buildable: &pb.Buildable{
			Id: 1,
		},
		TopmostTileDiscretePositionX: 1,
		TopmostTileDiscretePositionY: 1,
		CurrentLevel:                 1,
		State:                        0,
		BuildingOrUpgradingStartedAt: 1555987428446,
	}
	list := &pb.SyncDataStruct{
		PlayerBuildableBindingList: []*pb.PlayerBuildableBinding{
			&playerBuildable,
		},
	}

	res, _ := proto.Marshal(list)
	t.Log(base64.StdEncoding.EncodeToString(res))
}

func Test_GetPlayerBuildable(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		type respType struct {
			Ret                               int     `json:"ret"`
			ReqSeqNum                         int64   `json:"reqSeqNum"`
			SyncData                          string  `json:"syncData"`
			UnclaimedPlayerMissionBindingList []int32 `json:"unclaimedPlayerMissionBindingList"`
		}
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		now := utils.UnixtimeMilli()
		reqForm := make(url.Values)
		reqForm["intAuthToken"] = []string{intAuthToken}
		reqForm["reqSeqNum"] = []string{strconv.FormatInt(now, 10)}
		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/BuildableList/Query"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()
		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			panic(err)
		}
		var respStructIns respType
		_ = json.Unmarshal(respBody, &respStructIns)
		Logger.Info("body", zap.Any("body", respStructIns))
		theWaitGroup.Done()
	}

	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "mdd" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_Sync(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		playerBuildable := pb.PlayerBuildableBinding{
			PlayerId: 138,
			Buildable: &pb.Buildable{
				Id: 1,
			},
			TopmostTileDiscretePositionX: 1,
			TopmostTileDiscretePositionY: 1,
			CurrentLevel:                 2,
			State:                        0,
			BuildingOrUpgradingStartedAt: 1555987428446,
		}
		farmland := pb.PlayerBuildableBinding{
			PlayerId: 130,
			Buildable: &pb.Buildable{
				Id: 2,
			},
			TopmostTileDiscretePositionX: 1,
			TopmostTileDiscretePositionY: 1,
			CurrentLevel:                 1,
			State:                        0,
			BuildingOrUpgradingStartedAt: 1555987428446,
		}
		restaurant := pb.PlayerBuildableBinding{
			PlayerId: 130,
			Buildable: &pb.Buildable{
				Id: 3,
			},
			TopmostTileDiscretePositionX: 1,
			TopmostTileDiscretePositionY: 1,
			CurrentLevel:                 1,
			State:                        0,
			BuildingOrUpgradingStartedAt: 1555987428446,
		}
		list := &pb.SyncDataStruct{
			PlayerBuildableBindingList: []*pb.PlayerBuildableBinding{
				&playerBuildable, &farmland, &restaurant,
			},
			Wallet: &pb.WalletStruct{
				Gold:      100,
				GoldLimit: 4000,
			},
		}

		res, _ := proto.Marshal(list)
		str := base64.StdEncoding.EncodeToString(res)
		t.Log(str)
		reqForm := make(url.Values)
		now := utils.UnixtimeMilli()
		reqForm["intAuthToken"] = []string{intAuthToken}
		reqForm["syncData"] = []string{str}
		reqForm["reqSeqNum"] = []string{strconv.FormatInt(now, 10)}
		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/MySQL/SyncData/Upsync"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()
		theWaitGroup.Done()
	}

	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "mdd" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_GetMission(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		type respType struct {
			Ret         int                            `json:"ret"`
			MissionList []*models.PlayerMissionBinding `json:"missionList"`
		}
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		reqForm := make(url.Values)
		reqForm["intAuthToken"] = []string{intAuthToken}
		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/MissionList/Query"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()
		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			panic(err)
		}
		var respStructIns respType
		_ = json.Unmarshal(respBody, &respStructIns)
		Logger.Info("body", zap.Any("body", respStructIns))
		theWaitGroup.Done()
	}

	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "mdd" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_RewardObtain(t *testing.T) {
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		reqForm := make(url.Values)
		reqForm["intAuthToken"] = []string{intAuthToken}
		reqForm["missionId"] = []string{"1"}
		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		path := "/api/v1/Player/MissionReward/Obtain"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()
		theWaitGroup.Done()
	}

	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "mdd" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_IngredientProduce(t *testing.T) {
	fixedCountryCode := "086"           // Temporarily hardcoded.
	chosenTesterName := "add"           // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	autoCollect := "1"                  // Temporarily hardcoded.
	targetPlayerBuildableBindingId := 1 // Temporarily hardcoded.
	ingredientIdToProduce := 1          // Temporarily hardcoded.
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		toProduceCount := 4
		for i := 0; i < toProduceCount; i++ {
			reqForm := make(url.Values)
			reqForm["intAuthToken"] = []string{intAuthToken}
			reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
			reqForm["ingredientId"] = []string{strconv.FormatInt(int64(ingredientIdToProduce), 10)}
			reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(targetPlayerBuildableBindingId), 10)}
			reqForm["autoCollect"] = []string{autoCollect}
			protocol := "http"
			hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
			path := "/api/v1/Player/Ingredient/Produce"
			resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
			if nil != err {
				panic(err)
			}
			defer resp.Body.Close()

			if i == (toProduceCount - 1) {
				respBody, err := ioutil.ReadAll(resp.Body)
				if nil != err {
					fmt.Printf("Error occurs when reading response body from IngredientProduce API for player %s, resp == %v, err == %v.\n", chosenTesterName, resp, err)
					panic(err)
				}
				var respStructIns produceRespType
				err = json.Unmarshal(respBody, &respStructIns)
				if nil != err {
					fmt.Printf("Error occurs when unmarshaling the response body from IngredientProduce API for player %s, resp == %v, err == %v.\n", chosenTesterName, resp, err)
					panic(err)
				}
				Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

				if "true" == willCancel {
					// Cancel the 1st in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[0]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{autoCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						fmt.Printf("Error occurs when reading response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						panic(err)
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						fmt.Printf("Error occurs when unmarshaling the response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						panic(err)
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList))
				}
				theWaitGroup.Done()
			}
		}
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_SynthesizeToIngredientProgress(t *testing.T) {
	fixedCountryCode := "086"           // Temporarily hardcoded.
	chosenTesterName := "add"           // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	autoCollect := "1"                  // Temporarily hardcoded.
	targetPlayerBuildableBindingId := 2 // Temporarily hardcoded.
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		knapsackQueryReqForm := make(url.Values)
		knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
		knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
		knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
		knapsackQueryPath := "/api/v1/Player/Knapsack/Query"

		knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
		if nil != err {
			panic(err)
		}
		defer knapsackQueryResp.Body.Close()
		knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		var knapsackQueryRespStructIns knapsackQueryRespType
		err = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		Logger.Info("Unmarshalled knapsackQueryResp.Body info", zap.Any("knapsackQueryRespStructIns.Ret", knapsackQueryRespStructIns.Ret), zap.Any("knapsackQueryRespStructIns.KnapsackRecordList", knapsackQueryRespStructIns.KnapsackRecordList))

		// Temporarily hardcoded
		toUseConsumableList := make([]*models.Consumable, 0)
		toUseConsumableList = append(toUseConsumableList, &models.Consumable{
			KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[3].ID,
			Count:      1,
		})

		marshalledConsumableList, err := json.Marshal(toUseConsumableList)
		if nil != err {
			Logger.Error("Error occurs when marshalling toUseConsumableList", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
			t.FailNow()
		}
		reqForm := make(url.Values)
		reqForm["intAuthToken"] = []string{intAuthToken}
		reqForm["consumables"] = []string{string(marshalledConsumableList)}
		reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
		reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(targetPlayerBuildableBindingId), 10)}
		reqForm["autoCollect"] = []string{autoCollect}
		path := "/api/v1/Player/Knapsack/Synthesize"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()

		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
			t.FailNow()
		}
		var respStructIns synthesizeRespType
		err = json.Unmarshal(respBody, &respStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
			panic(err)
		}
		Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.ResultedIngredientProgress", respStructIns.ResultedIngredientProgress))

		if "true" == willCancel {
			// Cancel the IngredientProgress in queue.
			targetedIngredientProgress := respStructIns.ResultedIngredientProgress
			Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
			cancelReqForm := make(url.Values)
			cancelReqForm["intAuthToken"] = []string{intAuthToken}
			cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
			cancelReqForm["autoCollect"] = []string{autoCollect}
			cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
			cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
			cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
			defer cancelResp.Body.Close()
			cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
			if nil != err {
				Logger.Error("Error occurs when reading response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
				t.FailNow()
			}
			var cancelRespStructIns cancelRespType
			err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
			if nil != err {
				Logger.Error("Error occurs when unmarshaling response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
				panic(err)
			}
			Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList), zap.Any("cancelRespStructIns.KnapsackRecordList", cancelRespStructIns.KnapsackRecordList))
		}
		theWaitGroup.Done()
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_SynthesizeToManuallyCollectableIngredientProgress(t *testing.T) {
	fixedCountryCode := "086"           // Temporarily hardcoded.
	chosenTesterName := "add"           // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.
	autoCollect := "0"                  // Temporarily hardcoded.
	targetPlayerBuildableBindingId := 4 // Temporarily hardcoded.
	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
		knapsackQueryReqForm := make(url.Values)
		knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
		knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
		knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
		knapsackQueryPath := "/api/v1/Player/Knapsack/Query"
		knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
		if nil != err {
			panic(err)
		}
		defer knapsackQueryResp.Body.Close()
		knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		var knapsackQueryRespStructIns knapsackQueryRespType
		err = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		Logger.Info("Unmarshalled knapsackQueryResp.Body info", zap.Any("knapsackQueryRespStructIns.Ret", knapsackQueryRespStructIns.Ret), zap.Any("knapsackQueryRespStructIns.KnapsackRecordList", knapsackQueryRespStructIns.KnapsackRecordList))

		toUseConsumableList := make([]*models.Consumable, 0)
		// Temporarily hardcoded
		toUseConsumableList = append(toUseConsumableList, &models.Consumable{
			KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[8].ID,
			Count:      1,
		})

		marshalledConsumableList, err := json.Marshal(toUseConsumableList)
		if nil != err {
			fmt.Printf("Error occurs when marshalling toUseConsumableList for player %s, toUseConsumableList = %v, err == %v.\n", chosenTesterName, toUseConsumableList, err)
			panic(err)
		}
		reqForm := make(url.Values)
		reqForm["intAuthToken"] = []string{intAuthToken}
		reqForm["consumables"] = []string{string(marshalledConsumableList)}
		reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
		reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(targetPlayerBuildableBindingId), 10)}
		reqForm["autoCollect"] = []string{autoCollect}
		path := "/api/v1/Player/Knapsack/Synthesize"
		resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
		if nil != err {
			panic(err)
		}
		defer resp.Body.Close()

		respBody, err := ioutil.ReadAll(resp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading the response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
			t.FailNow()
		}
		var respStructIns synthesizeRespType
		err = json.Unmarshal(respBody, &respStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling the response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
			t.FailNow()
		}
		Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.ResultedIngredientProgress", respStructIns.ResultedIngredientProgress))

		if "true" == willCollect {
			// Collect the IngredientProgress in queue.
			time.Sleep(time.Duration(1500 * 1000000)) // In nanoseconds

			Logger.Info("About to collect for", zap.Any("targetPlayerBuildableBindingId", targetPlayerBuildableBindingId))
			collectReqForm := make(url.Values)
			collectReqForm["intAuthToken"] = []string{intAuthToken}
			collectReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
			collectReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(targetPlayerBuildableBindingId), 10)}
			collectPath := "/api/v1/Player/PlayerBuildableBinding/Ingredient/Collect"
			collectResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, collectPath), collectReqForm)
			defer collectResp.Body.Close()
			collectRespBody, err := ioutil.ReadAll(collectResp.Body)
			if nil != err {
				Logger.Error("Error occurs when reading the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
				t.FailNow()
			}
			var collectRespStructIns collectRespType
			err = json.Unmarshal(collectRespBody, &collectRespStructIns)
			if nil != err {
				Logger.Error("Error occurs when unmarshaling the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
				t.FailNow()
			}
			Logger.Info("Unmarshalled collectResp.Body info", zap.Any("collectRespStructIns.Ret", collectRespStructIns.Ret), zap.Any("collectRespStructIns.IngredientProgressList", collectRespStructIns.IngredientProgressList), zap.Any("collectRespStructIns.KnapsackRecordList", collectRespStructIns.KnapsackRecordList))
		}
		theWaitGroup.Done()
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_MassiveCrafting(t *testing.T) {
	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "add" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.

	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}

		Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
		db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
		if err != nil {
			t.Error("connect to mysql fails", err)
		}
		tx := db.MustBegin()
		defer tx.Rollback()

		query, args, err := sqlx.In("SELECT id FROM player WHERE name=? AND deleted_at IS NULL", chosenTesterName)
		if err != nil {
			t.FailNow()
		}
		query = tx.Rebind(query)
		if nil != err {
			t.FailNow()
		}

		var playerIds []int32
		err = tx.Select(&playerIds, query, args...)
		if nil != err {
			t.Error("get player fails ", err)
			t.FailNow()
		}
		Logger.Info("PlayerIds: ", zap.Any("array", playerIds))

		playerId := playerIds[0]

		// Delete ingredient_progress first.
		query, args, err = sq.Delete(models.TBL_INGREDIENT_PROGRESS).
			Where(sq.Eq{"owner_player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete ingredient_progress to sql fails", err)
			t.FailNow()
		}
		result, err := tx.Exec(query, args...)
		if nil != err {
			t.Error("delete ingredient_progress fails ", err)
			t.FailNow()
		}

		rowsAffected, err := result.RowsAffected()
		Logger.Info("delete ingredient_progress", zap.Int64("affected rows == ", rowsAffected))

		// Delete knapsack.
		query, args, err = sq.Delete(models.TBL_KNAPSACK).
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete knapsack to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if nil != err {
			t.Error("delete knapsack fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete knapsack", zap.Int64("affected rows == ", rowsAffected))

		// Initialize the knapsack again.
		toInitIngredientIdList := []int32{1, 2, 3, 4, 5, 6, 7, 8, 9}
		toInitIngredientCountList := []int32{40, 99, 99, 100, 256, 256, 256, 256, 233}
		for idx, toInitIngredientId := range toInitIngredientIdList {
			increCount := toInitIngredientCountList[idx]
			rowsAffected, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, playerId)
			if nil != localErr {
				t.FailNow()
			}
			if 0 < rowsAffected {
				// Deliberately left blank.
			}
		}

		err = tx.Commit()
		if nil != err {
			t.Error("commit fails", err)
			t.FailNow()
		}

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)

		// Query the "knapsack" data for later use.
		knapsackQueryReqForm := make(url.Values)
		knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
		knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
		knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
		knapsackQueryPath := "/api/v1/Player/Knapsack/Query"
		knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
		if nil != err {
			panic(err)
		}
		defer knapsackQueryResp.Body.Close()
		knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		var knapsackQueryRespStructIns knapsackQueryRespType
		err = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		Logger.Info("Unmarshalled knapsackQueryResp.Body info", zap.Any("knapsackQueryRespStructIns.Ret", knapsackQueryRespStructIns.Ret), zap.Any("knapsackQueryRespStructIns.KnapsackRecordList", knapsackQueryRespStructIns.KnapsackRecordList))

		// Temporarily hardcoded.
		useAutoCollect := "1"
		useManualCollect := "0"
		// Produce 10 auto-collect "ingredient_progress" records, and immediately cancel the 2nd.
		{
			// Temporarily hardcoded.
			playerBuildableBindingIdForProduceAutoCollect := 2
			ingredientIdForProduceAutoCollect := 8

			toProduceCount := 10
			for i := 0; i < toProduceCount; i++ {
				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["ingredientId"] = []string{strconv.FormatInt(int64(ingredientIdForProduceAutoCollect), 10)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceAutoCollect), 10)}
				reqForm["autoCollect"] = []string{useAutoCollect}
				protocol := "http"
				hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
				path := "/api/v1/Player/Ingredient/Produce"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					panic(err)
				}
				defer resp.Body.Close()

				if i == (toProduceCount - 1) {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns produceRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

					// Cancel the 3rd in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[2]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{useAutoCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList))
				}
			}
		}
		// Produce 10 manual-collect "ingredient_progress" records, immediately cancel the 5th, wait for 2 seconds and collect.
		{
			// Temporarily hardcoded.
			playerBuildableBindingIdForProduceManualCollect := 3
			ingredientIdForProduceManualCollect := 7

			toProduceCount := 10
			for i := 0; i < toProduceCount; i++ {
				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["ingredientId"] = []string{strconv.FormatInt(int64(ingredientIdForProduceManualCollect), 10)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceManualCollect), 10)}
				reqForm["autoCollect"] = []string{useManualCollect}
				protocol := "http"
				hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
				path := "/api/v1/Player/Ingredient/Produce"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					panic(err)
				}
				defer resp.Body.Close()

				if i == (toProduceCount - 1) {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns produceRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

					// Cancel the 5th in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[4]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{useManualCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						fmt.Printf("Error occurs when reading response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						t.FailNow()
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						fmt.Printf("Error occurs when unmarshaling the response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						t.FailNow()
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList))

					// Collect the IngredientProgress in queue.
					time.Sleep(time.Duration(2000 * 1000000)) // In nanoseconds

					collectReqForm := make(url.Values)
					collectReqForm["intAuthToken"] = []string{intAuthToken}
					collectReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					collectReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceManualCollect), 10)}
					collectPath := "/api/v1/Player/PlayerBuildableBinding/Ingredient/Collect"
					collectResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, collectPath), collectReqForm)
					defer collectResp.Body.Close()
					collectRespBody, err := ioutil.ReadAll(collectResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					var collectRespStructIns collectRespType
					err = json.Unmarshal(collectRespBody, &collectRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled collectResp.Body info", zap.Any("collectRespStructIns.Ret", collectRespStructIns.Ret), zap.Any("collectRespStructIns.IngredientProgressList", collectRespStructIns.IngredientProgressList), zap.Any("collectRespStructIns.KnapsackRecordList", collectRespStructIns.KnapsackRecordList))
				}
			}
		}
		// Synthesize 10 auto-collect "ingredient_progress" records and immediately cancel the 3rd.
		{
			// Temporarily hardcoded
			playerBuildableBindingIdForSynthesizeAutoCollect := 4
			toUseConsumableList := make([]*models.Consumable, 0)
			toUseConsumableList = append(toUseConsumableList, &models.Consumable{
				KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[2].ID,
				Count:      2,
			})
			toUseConsumableList = append(toUseConsumableList, &models.Consumable{
				KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[8].ID,
				Count:      1,
			})

			marshalledConsumableList, err := json.Marshal(toUseConsumableList)
			if nil != err {
				Logger.Error("Error occurs when marshalling", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
				t.FailNow()
			}

			toSynthesizeCount := 10
			for i := 0; i < toSynthesizeCount; i++ {
				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["consumables"] = []string{string(marshalledConsumableList)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForSynthesizeAutoCollect), 10)}
				reqForm["autoCollect"] = []string{useAutoCollect}
				path := "/api/v1/Player/Knapsack/Synthesize"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					Logger.Error("Error occurs when requesting the KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
					t.FailNow()
				}
				defer resp.Body.Close()

				if i == toSynthesizeCount-1 {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns synthesizeRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.ResultedIngredientProgress", respStructIns.ResultedIngredientProgress), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

					// Cancel the 3rd in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[2]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{useAutoCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList), zap.Any("cancelRespStructIns.KnapsackRecordList", cancelRespStructIns.KnapsackRecordList))
				}
			}
		}
		// Synthesize 10 manual-collect "ingredient_progress" records, immediately cancel the 7th, wait for 3 seconds and collect.
		{
			// Temporarily hardcoded
			playerBuildableBindingIdForSynthesizeManualCollect := 5
			toUseConsumableList := make([]*models.Consumable, 0)
			toUseConsumableList = append(toUseConsumableList, &models.Consumable{
				KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[0].ID,
				Count:      1,
			})

			marshalledConsumableList, err := json.Marshal(toUseConsumableList)
			if nil != err {
				Logger.Error("Error occurs when marshalling", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
				t.FailNow()
			}

			toSynthesizeCount := 10
			for i := 0; i < toSynthesizeCount; i++ {
				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["consumables"] = []string{string(marshalledConsumableList)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForSynthesizeManualCollect), 10)}
				reqForm["autoCollect"] = []string{useManualCollect}
				path := "/api/v1/Player/Knapsack/Synthesize"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					Logger.Error("Error occurs when requesting the KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
					t.FailNow()
				}
				defer resp.Body.Close()

				if i == toSynthesizeCount-1 {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns synthesizeRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.ResultedIngredientProgress", respStructIns.ResultedIngredientProgress))

					// Cancel the 7th in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[6]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{useManualCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling response body from IngredientProgressCancel API", zap.Any("player", chosenTesterName), zap.Any("cancelResp", cancelResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList), zap.Any("cancelRespStructIns.KnapsackRecordList", cancelRespStructIns.KnapsackRecordList))

					// Collect the IngredientProgress in queue.
					time.Sleep(time.Duration(8000 * 1000000)) // In nanoseconds

					collectReqForm := make(url.Values)
					collectReqForm["intAuthToken"] = []string{intAuthToken}
					collectReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					collectReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForSynthesizeManualCollect), 10)}
					collectPath := "/api/v1/Player/PlayerBuildableBinding/Ingredient/Collect"
					collectResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, collectPath), collectReqForm)
					defer collectResp.Body.Close()
					collectRespBody, err := ioutil.ReadAll(collectResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					var collectRespStructIns collectRespType
					err = json.Unmarshal(collectRespBody, &collectRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled collectResp.Body info", zap.Any("collectRespStructIns.Ret", collectRespStructIns.Ret), zap.Any("collectRespStructIns.IngredientProgressList", collectRespStructIns.IngredientProgressList), zap.Any("collectRespStructIns.KnapsackRecordList", collectRespStructIns.KnapsackRecordList))
				}
			}
		}
		// Reclaim 10 "ingredient_progress" records, immediately cancel the 7th, wait for 3 seconds and collect.
		{
			// Temporarily hardcoded
			playerBuildableBindingIdForSynthesizeManualCollect := 6
			reclaimIngredientId := knapsackQueryRespStructIns.KnapsackRecordList[3].Ingredient.ID

			if nil != err {
				Logger.Error("Error occurs when marshalling", zap.Any("player", chosenTesterName), zap.Error(err))
				t.FailNow()
			}

			toReclaimCount := 10
			for i := 0; i < toReclaimCount; i++ {
				reclaimReqForm := make(url.Values)
				reclaimReqForm["intAuthToken"] = []string{intAuthToken}
				reclaimReqForm["targetIngredientId"] = []string{strconv.FormatInt(int64(reclaimIngredientId), 10)}
				reclaimReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reclaimReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForSynthesizeManualCollect), 10)}
				path := "/api/v1/Player/Knapsack/Reclaim"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reclaimReqForm)
				if nil != err {
					Logger.Error("Error occurs when requesting the Reclaim API", zap.Any("player", chosenTesterName), zap.Error(err))
					t.FailNow()
				}
				defer resp.Body.Close()

				if i == toReclaimCount-1 {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading response body from Reclaim API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns reclaimRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling response body from Reclaim API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.ResultedIngredientProgress", respStructIns.ResultedIngredientProgress), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

					// Cancel the 7th in queue.
					targetedIngredientProgress := respStructIns.IngredientProgressList[6]
					Logger.Info("About to cancel an ingredientProgress", zap.Any("targetedIngredientProgress", targetedIngredientProgress))
					cancelReqForm := make(url.Values)
					cancelReqForm["intAuthToken"] = []string{intAuthToken}
					cancelReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					cancelReqForm["autoCollect"] = []string{useManualCollect}
					cancelReqForm["ingredientProgressId"] = []string{strconv.FormatInt(int64(targetedIngredientProgress.Id), 10)}
					cancelPath := "/api/v1/Player/IngredientProgress/Cancel"
					cancelResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, cancelPath), cancelReqForm)
					defer cancelResp.Body.Close()
					cancelRespBody, err := ioutil.ReadAll(cancelResp.Body)
					if nil != err {
						fmt.Printf("Error occurs when reading response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						panic(err)
					}
					var cancelRespStructIns cancelRespType
					err = json.Unmarshal(cancelRespBody, &cancelRespStructIns)
					if nil != err {
						fmt.Printf("Error occurs when unmarshaling the response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, cancelResp, err)
						panic(err)
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", cancelRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", cancelRespStructIns.IngredientProgressList))

					// Collect the IngredientProgress in queue.
					time.Sleep(time.Duration(10000 * 1000000)) // In nanoseconds

					// Query the "player_bulk_sync_data" for collecting reference.
					playerBuildableListQueryReqForm := make(url.Values)
					playerBuildableListQueryReqForm["intAuthToken"] = []string{intAuthToken}
					playerBuildableListQueryReqForm["reqSeqNum"] = []string{"1"}
					playerBuildableListQueryReqForm["targetPlayerId"] = []string{strconv.FormatInt(int64(playerId), 10)}
					playerBuildableListQueryPath := "/api/v1/Player/BuildableList/Query"
					playerBuildableListQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, playerBuildableListQueryPath), playerBuildableListQueryReqForm)
					if nil != err {
						panic(err)
					}
					defer playerBuildableListQueryResp.Body.Close()
					playerBuildableListQueryRespBody, err := ioutil.ReadAll(playerBuildableListQueryResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from PlayerBuildableListQuery API", zap.Any("player", chosenTesterName), zap.Any("playerBuildableListQueryResp", playerBuildableListQueryResp), zap.Error(err))
						t.FailNow()
					}
					var playerBuildableListQueryRespStructIns playerBuildableListQueryRespType
					err = json.Unmarshal(playerBuildableListQueryRespBody, &playerBuildableListQueryRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from PlayerBuildableListQuery API", zap.Any("player", chosenTesterName), zap.Any("playerBuildableListQueryResp", playerBuildableListQueryResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled playerBuildableListQueryResp.Body info", zap.Any("playerBuildableListQueryRespStructIns.Ret", playerBuildableListQueryRespStructIns.Ret))

					collectReqForm := make(url.Values)
					collectReqForm["intAuthToken"] = []string{intAuthToken}
					collectReqForm["reqSeqNum"] = []string{"1"}                                           // Temporarily hardcoded.
					collectReqForm["syncData"] = []string{playerBuildableListQueryRespStructIns.SyncData} // Yep it's completely unchanged for test purpose, I don't give it a shit. -- YFLu

					toClaimIngredientProgressList := []int32{} // "Id"s only.
					for _, v := range playerBuildableListQueryRespStructIns.IngredientProgressList {
						theState := *(v.PtrState)
						if models.INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED == theState {
							toClaimIngredientProgressList = append(toClaimIngredientProgressList, v.Id)
						}
					}
					marshalledToClaimIngredientProgressList, err := json.Marshal(toClaimIngredientProgressList)
					if nil != err {
						Logger.Error("Error marshalling `toClaimIngredientProgressList`", zap.Any("player", chosenTesterName), zap.Any("toClaimIngredientProgressList", toClaimIngredientProgressList), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("About to call `Upsync API` to collect reclaimed ingredient_progress records", zap.Any("marshalledToClaimIngredientProgressList", string(marshalledToClaimIngredientProgressList)))

					collectReqForm["toClaimIngredientProgressList"] = []string{string(marshalledToClaimIngredientProgressList)}
					collectPath := "/api/v1/Player/MySQL/SyncData/Upsync"
					collectResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, collectPath), collectReqForm)
					defer collectResp.Body.Close()
					collectRespBody, err := ioutil.ReadAll(collectResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from PlayerUpsync API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					var collectRespStructIns upsyncRespType
					err = json.Unmarshal(collectRespBody, &collectRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from PlayerUpsync API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled collectResp.Body info", zap.Any("collectRespStructIns.Ret", collectRespStructIns.Ret), zap.Any("collectRespStructIns.NewlyClaimedIngredientProgressList", collectRespStructIns.NewlyClaimedIngredientProgressList))
				}
			}

		}

		{
			knapsackQueryReqForm := make(url.Values)
			knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
			knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
			knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
			knapsackQueryPath := "/api/v1/Player/Knapsack/Query"
			knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
			if nil != err {
				panic(err)
			}
			defer knapsackQueryResp.Body.Close()
			knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
			if nil != err {
				Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
				t.FailNow()
			}
			var knapsackQueryRespStructIns knapsackQueryRespType
			_ = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
			startAtNotNullCount := make(map[int64]int32)
			for _, item := range knapsackQueryRespStructIns.IngredientProgressList {
				if nil != item.StartedAt && item.StartedAt.Valid && item.StartedAt.Int64 > 0 {
					Logger.Info("checking IngredientProgressList", zap.Any("IngredientProgress", item))
					if nil == item.PlayerBuildableBindingId || !item.PlayerBuildableBindingId.Valid {
						continue
					}
					if startAtNotNullCount[item.PlayerBuildableBindingId.Int64] > 0 {
						panic("There is more than one progress working in the queue.")
					}
					startAtNotNullCount[item.PlayerBuildableBindingId.Int64] = 1
				}
			}
			Logger.Info("Unmarshalled knapsackQueryResp.Body info", zap.Any("knapsackQueryRespStructIns.Ret", knapsackQueryRespStructIns.Ret), zap.Any("knapsackQueryRespStructIns.KnapsackRecordList", knapsackQueryRespStructIns.KnapsackRecordList))
			if len(knapsackQueryRespStructIns.IngredientProgressList) != 17 {
				panic("Something wrong in IngredientProgressList")
			}
		}

		// Validate db resulted records.

		tx = db.MustBegin()
		defer tx.Rollback()
		// TODO
		tx.Commit()

		theWaitGroup.Done()
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_BoostProgress(t *testing.T) {
	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "add" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.

	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}
		useManualCollect := "0"

		Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
		db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
		if err != nil {
			t.Error("connect to mysql fails", err)
		}
		tx := db.MustBegin()
		defer tx.Rollback()

		query, args, err := sqlx.In("SELECT id FROM player WHERE name=? AND deleted_at IS NULL", chosenTesterName)
		if err != nil {
			t.FailNow()
		}
		query = tx.Rebind(query)
		if nil != err {
			t.FailNow()
		}

		var playerIds []int32
		err = tx.Select(&playerIds, query, args...)
		if nil != err {
			t.Error("get player fails ", err)
			t.FailNow()
		}
		Logger.Info("PlayerIds: ", zap.Any("array", playerIds))

		playerId := playerIds[0]

		// Delete ingredient_progress first.
		query, args, err = sq.Delete(models.TBL_INGREDIENT_PROGRESS).
			Where(sq.Eq{"owner_player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete ingredient_progress to sql fails", err)
			t.FailNow()
		}
		result, err := tx.Exec(query, args...)
		if nil != err {
			t.Error("delete ingredient_progress fails ", err)
			t.FailNow()
		}

		rowsAffected, err := result.RowsAffected()
		Logger.Info("delete ingredient_progress", zap.Int64("affected rows == ", rowsAffected))

		// Delete knapsack.
		query, args, err = sq.Delete(models.TBL_KNAPSACK).
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete knapsack to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if nil != err {
			t.Error("delete knapsack fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete knapsack", zap.Int64("affected rows == ", rowsAffected))

		// Initialize the knapsack again.
		toInitIngredientIdList := []int32{1, 2, 3, 4, 5, 6, 7, 8, 9}
		toInitIngredientCountList := []int32{40, 99, 99, 100, 256, 256, 256, 256, 233}
		for idx, toInitIngredientId := range toInitIngredientIdList {
			increCount := toInitIngredientCountList[idx]
			rowsAffected, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, playerId)
			if nil != localErr {
				t.FailNow()
			}
			if 0 < rowsAffected {
				// Deliberately left blank.
			}
		}

		err = tx.Commit()
		if nil != err {
			t.Error("commit fails", err)
			t.FailNow()
		}

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)

		// Query the "knapsack" data for later use.
		knapsackQueryReqForm := make(url.Values)
		knapsackQueryReqForm["intAuthToken"] = []string{intAuthToken}
		knapsackQueryReqForm["targetPage"] = []string{"1"}    // Temporarily hardcoded.
		knapsackQueryReqForm["countPerPage"] = []string{"20"} // Temporarily hardcoded.
		knapsackQueryPath := "/api/v1/Player/Knapsack/Query"
		knapsackQueryResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, knapsackQueryPath), knapsackQueryReqForm)
		if nil != err {
			panic(err)
		}
		defer knapsackQueryResp.Body.Close()
		knapsackQueryRespBody, err := ioutil.ReadAll(knapsackQueryResp.Body)
		if nil != err {
			Logger.Error("Error occurs when reading the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		var knapsackQueryRespStructIns knapsackQueryRespType
		err = json.Unmarshal(knapsackQueryRespBody, &knapsackQueryRespStructIns)
		if nil != err {
			Logger.Error("Error occurs when unmarshaling the response body from KnapsackQuery API", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryResp", knapsackQueryResp), zap.Error(err))
			t.FailNow()
		}
		Logger.Info("Unmarshalled knapsackQueryResp.Body info", zap.Any("knapsackQueryRespStructIns.Ret", knapsackQueryRespStructIns.Ret), zap.Any("knapsackQueryRespStructIns.KnapsackRecordList", knapsackQueryRespStructIns.KnapsackRecordList))

		{
			// Temporarily hardcoded.
			playerBuildableBindingIdForProduceManualCollect := 3
			ingredientIdForProduceManualCollect := 7

			toProduceCount := 10
			for i := 0; i < toProduceCount; i++ {
				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["ingredientId"] = []string{strconv.FormatInt(int64(ingredientIdForProduceManualCollect), 10)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceManualCollect), 10)}
				reqForm["autoCollect"] = []string{useManualCollect}
				protocol := "http"
				hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
				path := "/api/v1/Player/Ingredient/Produce"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					panic(err)
				}
				defer resp.Body.Close()

				if i == (toProduceCount - 1) {
					respBody, err := ioutil.ReadAll(resp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					var respStructIns produceRespType
					err = json.Unmarshal(respBody, &respStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled resp.Body info", zap.Any("respStructIns.Ret", respStructIns.Ret), zap.Any("respStructIns.IngredientProgressList", respStructIns.IngredientProgressList))

					// Boost the 8th in queue.
					Logger.Info("About to boost ingredientProgresses")
					boostReqForm := make(url.Values)
					boostReqForm["intAuthToken"] = []string{intAuthToken}
					boostReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					boostReqForm["autoCollect"] = []string{useManualCollect}
					boostReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceManualCollect), 10)}
					boostPath := "/api/v1/Player/IngredientProgress/Boosting"
					boostResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, boostPath), boostReqForm)
					defer boostResp.Body.Close()
					boostRespBody, err := ioutil.ReadAll(boostResp.Body)
					if nil != err {
						fmt.Printf("Error occurs when reading response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, boostResp, err)
						t.FailNow()
					}
					var boostRespStructIns boostRespType
					err = json.Unmarshal(boostRespBody, &boostRespStructIns)
					if nil != err {
						fmt.Printf("Error occurs when unmarshaling the response body from IngredientProgressCancel API for player %s, cancelResp == %v, err == %v.\n", chosenTesterName, boostResp, err)
						t.FailNow()
					}
					Logger.Info("Unmarshalled cancelResp.Body info", zap.Any("cancelRespStructIns.Ret", boostRespStructIns.Ret), zap.Any("cancelRespStructIns.IngredientProgressList", boostRespStructIns.IngredientProgressList))

					// Collect the IngredientProgress in queue.
					//time.Sleep(time.Duration(2000 * 1000000)) // In nanoseconds

					collectReqForm := make(url.Values)
					collectReqForm["intAuthToken"] = []string{intAuthToken}
					collectReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
					collectReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceManualCollect), 10)}
					collectPath := "/api/v1/Player/PlayerBuildableBinding/Ingredient/Collect"
					collectResp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, collectPath), collectReqForm)
					defer collectResp.Body.Close()
					collectRespBody, err := ioutil.ReadAll(collectResp.Body)
					if nil != err {
						Logger.Error("Error occurs when reading the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					var collectRespStructIns collectRespType
					err = json.Unmarshal(collectRespBody, &collectRespStructIns)
					if nil != err {
						Logger.Error("Error occurs when unmarshaling the response body from PlayerBuildableBindingIngredientCollect API", zap.Any("player", chosenTesterName), zap.Any("collectResp", collectResp), zap.Error(err))
						t.FailNow()
					}
					Logger.Info("Unmarshalled collectResp.Body info", zap.Any("collectRespStructIns.Ret", collectRespStructIns.Ret), zap.Any("collectRespStructIns.IngredientProgressList", collectRespStructIns.IngredientProgressList), zap.Any("collectRespStructIns.KnapsackRecordList", collectRespStructIns.KnapsackRecordList))
				}
			}
		}

		theWaitGroup.Done()
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}

func Test_InitKnapsackForExistedUser(t *testing.T) {
	var playerIds []int32

	Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
	db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
	if err != nil {
		t.Error("connect to mysql fails", err)
	}
	tx := db.MustBegin()
	defer tx.Rollback()

	query, args, err := sqlx.In("SELECT id FROM player WHERE deleted_at IS NULL")
	if err != nil {
		t.FailNow()
	}
	query = tx.Rebind(query)
	if nil != err {
		t.FailNow()
	}

	err = tx.Select(&playerIds, query, args...)
	if nil != err {
		t.Error("get player fails ", err)
		t.FailNow()
	}
	Logger.Info("PlayerIds: ", zap.Any("array", playerIds))
	for i, _ := range playerIds {
		playerId := playerIds[i]

		// Initialize the knapsack again.
		toInitIngredientIdList := []int32{1000, 1001}
		toInitIngredientCountList := []int32{5, 5}
		for idx, toInitIngredientId := range toInitIngredientIdList {
			increCount := toInitIngredientCountList[idx]
			rowsAffected, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, playerId)
			if nil != localErr {
				t.FailNow()
			}
			if 0 < rowsAffected {
				// Deliberately left blank.
			}
		}
	}
	err = tx.Commit()
	if nil != err {
		t.Error("commit fails", err)
		t.FailNow()
	}
}

func Test_HqConcurrentQueues(t *testing.T) {
	fixedCountryCode := "086" // Temporarily hardcoded.
	chosenTesterName := "add" // Temporarily hardcoded, should be obtained randomly from preconfigured Sqlite table.

	var theWaitGroup sync.WaitGroup
	var thirdStep KeyActionStepGeneral
	thirdStep = func(intAuthToken string) {
		if "" == intAuthToken {
			t.Errorf("Obtained `intAuthToken` = %v, want non-empty.", intAuthToken)
		}

		Logger.Info("About to connect to MySQL server", zap.Any("DSN", Conf.MySQL.DSN))
		db, err := sqlx.Connect("mysql", Conf.MySQL.DSN)
		if err != nil {
			t.Error("connect to mysql fails", err)
		}
		tx := db.MustBegin()
		defer tx.Rollback()

		query, args, err := sqlx.In("SELECT id FROM player WHERE name=? AND deleted_at IS NULL", chosenTesterName)
		if err != nil {
			t.FailNow()
		}
		query = tx.Rebind(query)
		if nil != err {
			t.FailNow()
		}

		var playerIds []int32
		err = tx.Select(&playerIds, query, args...)
		if nil != err {
			t.Error("get player fails ", err)
			t.FailNow()
		}
		Logger.Info("PlayerIds: ", zap.Any("array", playerIds))

		playerId := playerIds[0]

		// Delete ingredient_progress first.
		query, args, err = sq.Delete(models.TBL_INGREDIENT_PROGRESS).
			Where(sq.Eq{"owner_player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete ingredient_progress to sql fails", err)
			t.FailNow()
		}
		result, err := tx.Exec(query, args...)
		if nil != err {
			t.Error("delete ingredient_progress fails ", err)
			t.FailNow()
		}

		rowsAffected, err := result.RowsAffected()
		Logger.Info("delete ingredient_progress", zap.Int64("affected rows == ", rowsAffected))

		// Delete knapsack.
		query, args, err = sq.Delete(models.TBL_KNAPSACK).
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete knapsack to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if nil != err {
			t.Error("delete knapsack fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete knapsack", zap.Int64("affected rows == ", rowsAffected))

		// Delete player recipe.
		query, args, err = sq.Delete(models.TBL_PLAYER_RECIPE).
			Where(sq.Eq{"player_id": playerId}).ToSql()

		if nil != err {
			t.Error("delete player recipe to sql fails", err)
			t.FailNow()
		}
		result, err = tx.Exec(query, args...)
		if nil != err {
			t.Error("delete player recipe fails ", err)
			t.FailNow()
		}

		rowsAffected, err = result.RowsAffected()
		Logger.Info("delete player recipe", zap.Int64("affected rows == ", rowsAffected))

		// The only StatefulBuildable owned by this test player is a level 10 Hq, providing "allowed population == 120"
		buildableBindingList := make([]*pb.PlayerBuildableBinding, 0)
		buildableBindingList = append(buildableBindingList, &pb.PlayerBuildableBinding{
			Id: 2,
			Buildable: &pb.Buildable{
				Id: 1,
			},
			CurrentLevel: 10,
		})
		syncData := &pb.SyncDataStruct{
			PlayerBuildableBindingList: buildableBindingList,
		}
		syncDataByte, _ := proto.Marshal(syncData)
		encoded := base64.StdEncoding.EncodeToString(syncDataByte)
		_, err = models.PlayerSyncData(tx, playerId, encoded, utils.UnixtimeMilli())
		if nil != err {
			t.FailNow()
		}

		// Initialize the knapsack again, e.g. having 10 of Soldier#1000, 10 of Soldier#1001, 10 of Soldier#1002, occupying 80/120 of the population.
		toInitIngredientIdList := []int32{1000, 1001, 1002}
		toInitIngredientCountList := []int32{10, 10, 10}
		for idx, toInitIngredientId := range toInitIngredientIdList {
			increCount := toInitIngredientCountList[idx]
			rowsAffected, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, playerId)
			if nil != localErr {
				t.FailNow()
			}
			if 0 < rowsAffected {
				// Deliberately left blank.
			}
		}

		// The recipe with id == 1 is "1000 + 1001 -> 1002", unlocked and useable since the level 3 Hq (the same level to unlock producing of Soldier#1001).
		playerRecipe := &pb.PlayerRecipe{
			RecipeId: 1,
			State:    models.PLAYER_RECIPE_UNLOCKED,
		}
		err = models.InsertPlayerRecipe(tx, playerId, playerRecipe)
		if nil != err {
			t.FailNow()
		}

		err = tx.Commit()
		if nil != err {
			t.Error("commit fails", err)
			t.FailNow()
		}

		protocol := "http"
		hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)

		// Query the "knapsack" data for later use.
		var knapsackQueryRespStructIns knapsackQueryRespType
		knapsackQueryRespStructIns = _queryKnapsack(chosenTesterName, intAuthToken, protocol, hostAndPort)

		// Temporarily hardcoded.
		useAutoCollect := "1"

    var toCancelProducingProgressId int32 = 0
    var toCancelSynthesizingProgressId int32 = 0
    var toCancelReclaimingProgressId int32 = 0

		// add produce progress
		{
			for i := 0; i < 4; i++ {
				playerBuildableBindingIdForProduceAutoCollect := 2
				ingredientIdForProduceAutoCollect := 1000 // Produce some "Soldier#1001", each taking 5,000ms.

				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["ingredientId"] = []string{strconv.FormatInt(int64(ingredientIdForProduceAutoCollect), 10)}
				reqForm["skipPlayerRecipeCheck"] = []string{strconv.FormatInt(int64(1), 10)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForProduceAutoCollect), 10)}
				reqForm["autoCollect"] = []string{useAutoCollect}
				protocol := "http"
				hostAndPort := fmt.Sprintf("%s:%v", GameServerHostAndPath, Conf.Sio.Port)
				path := "/api/v1/Player/Ingredient/Produce"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					panic(err)
				}
				defer resp.Body.Close()

				respBody, err := ioutil.ReadAll(resp.Body)
				if nil != err {
					Logger.Error("Error occurs when reading the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
					t.FailNow()
				}
				var respStructIns produceRespType
				err = json.Unmarshal(respBody, &respStructIns)
				if nil != err {
					Logger.Error("Error occurs when unmarshaling the response body from IngredientProduce API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
					t.FailNow()
				}
        if (i == 2) {
          toCancelProducingProgressId = respStructIns.IngredientProgressList[2].Id
        }
			}
		}

		// add synthesize progress
		{
			for i := 0; i < 5; i++ {
				playerBuildableBindingIdForSynthesizeAutoCollect := 2
				playerTargetBuildableId := 1

				// Synthesize some "Soldier#1002" by "Recipe#1 (1000 + 1001 -> 1002)", each taking 5,000ms.
				toUseConsumableList := make([]*models.Consumable, 0)
				toUseConsumableList = append(toUseConsumableList, &models.Consumable{
					KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[0].ID,
					Count:      1,
				})
				toUseConsumableList = append(toUseConsumableList, &models.Consumable{
					KnapsackId: knapsackQueryRespStructIns.KnapsackRecordList[1].ID,
					Count:      1,
				})

				marshalledConsumableList, err := json.Marshal(toUseConsumableList)
				if nil != err {
					Logger.Error("Error occurs when marshalling", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
					t.FailNow()
				}

				reqForm := make(url.Values)
				reqForm["intAuthToken"] = []string{intAuthToken}
				reqForm["consumables"] = []string{string(marshalledConsumableList)}
				reqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
				reqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForSynthesizeAutoCollect), 10)}
				reqForm["targetBuildableId"] = []string{strconv.FormatInt(int64(playerTargetBuildableId), 10)}
				reqForm["autoCollect"] = []string{useAutoCollect}
				path := "/api/v1/Player/Knapsack/Synthesize"
				resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reqForm)
				if nil != err {
					Logger.Error("Error occurs when requesting the KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("toUseConsumableList", toUseConsumableList), zap.Error(err))
					t.FailNow()
				}
				defer resp.Body.Close()

				respBody, err := ioutil.ReadAll(resp.Body)
				if nil != err {
					Logger.Error("Error occurs when reading response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
					t.FailNow()
				}
				var respStructIns synthesizeRespType
				err = json.Unmarshal(respBody, &respStructIns)
				if nil != err {
					Logger.Error("Error occurs when unmarshaling response body from KnapsackSynthesize API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
					t.FailNow()
				}
        if (i == 4) {
          toCancelSynthesizingProgressId = respStructIns.ResultedIngredientProgress.Id
        }
			}
		}

		// add reclaim progress
		{
			// Reclaim some "Soldier#1002", each taking 10,000ms.
			playerBuildableBindingIdForReclaim := 2
			reclaimIngredientId := knapsackQueryRespStructIns.KnapsackRecordList[2].Ingredient.ID

			reclaimReqForm := make(url.Values)
			reclaimReqForm["intAuthToken"] = []string{intAuthToken}
			reclaimReqForm["targetIngredientList"] = []string{fmt.Sprintf("{\"%s\": 3}", strconv.FormatInt(int64(reclaimIngredientId), 10))} // Deliberately testing a batch reclaim of the same ingredient triple times.

			reclaimReqForm["reqSeqNum"] = []string{"1"} // Temporarily hardcoded.
			reclaimReqForm["targetPlayerBuildableBindingId"] = []string{strconv.FormatInt(int64(playerBuildableBindingIdForReclaim), 10)}
			path := "/api/v1/Player/Knapsack/Reclaim"
			resp, err := http.PostForm(fmt.Sprintf("%s://%s%s", protocol, hostAndPort, path), reclaimReqForm)
			if nil != err {
				Logger.Error("Error occurs when requesting the Reclaim API", zap.Any("player", chosenTesterName), zap.Error(err))
				t.FailNow()
			}
			defer resp.Body.Close()

			respBody, err := ioutil.ReadAll(resp.Body)
			if nil != err {
				Logger.Error("Error occurs when reading response body from Reclaim API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
				t.FailNow()
			}
			var respStructIns reclaimRespType
			err = json.Unmarshal(respBody, &respStructIns)
			if nil != err {
				Logger.Error("Error occurs when unmarshaling response body from Reclaim API", zap.Any("player", chosenTesterName), zap.Any("resp", resp), zap.Error(err))
				t.FailNow()
			}
      for _, item := range respStructIns.IngredientProgressList {
        // Just traverse to obtain the last.
        toCancelReclaimingProgressId = item.Id
      }
		}

    {
			cancelRespIns := _cancelIngredientProgress(chosenTesterName, intAuthToken, protocol, hostAndPort, toCancelProducingProgressId, "1")
			Logger.Info("Unmarshalled resp.Body info", zap.Any("cancelRespIns.Ret", cancelRespIns.Ret))
    }

		// Immediately queries the list of resulted "ingredient_progress".
		{
			knapsackQueryRespStructIns := _queryKnapsack(chosenTesterName, intAuthToken, protocol, hostAndPort)
			if 11 != len(knapsackQueryRespStructIns.IngredientProgressList) {
				Logger.Error("KnapsackQuery#1 for progressList, there should be in total 10 ongoing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			producingCount := 0
			synthesizingCount := 0
			reclaimingCount := 0
			for _, item := range knapsackQueryRespStructIns.IngredientProgressList {
				switch item.ProgressType {
				case models.INGREDIENT_PROGRESS_TYPE_PRODUCE:
					producingCount++
				case models.INGREDIENT_PROGRESS_TYPE_SYNTHESIZE:
					synthesizingCount++
				case models.INGREDIENT_PROGRESS_TYPE_RECLAIM:
					reclaimingCount++
				}
			}
			if 3 != producingCount {
				Logger.Error("KnapsackQuery#1 for progressList, there should be in total 3 producing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("producingCount", producingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 5 != synthesizingCount {
				Logger.Error("KnapsackQuery#1 for progressList, there should be in total 4 synthesizing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("synthesizingCount", synthesizingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 3 != reclaimingCount {
				Logger.Error("KnapsackQuery#1 for progressList, there should be in total 3 reclaiming ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("reclaimingCount", reclaimingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			Logger.Info("KnapsackQuery#1 for progressList done")
		}

		time.Sleep(time.Duration(6000 * 1000000)) // In nanoseconds
		{
			knapsackQueryRespStructIns := _queryKnapsack(chosenTesterName, intAuthToken, protocol, hostAndPort)
			if 9 != len(knapsackQueryRespStructIns.IngredientProgressList) {
				Logger.Error("KnapsackQuery#2 for progressList, there should be in total 8 ongoing ingredient_progress", zap.Any("player", chosenTesterName))
				for _, progress := range knapsackQueryRespStructIns.IngredientProgressList {
					Logger.Info("", zap.Any("", progress))
				}
				t.FailNow()
			}
			producingCount := 0
			synthesizingCount := 0
			reclaimingCount := 0
			for _, item := range knapsackQueryRespStructIns.IngredientProgressList {
				switch item.ProgressType {
				case models.INGREDIENT_PROGRESS_TYPE_PRODUCE:
					producingCount++
				case models.INGREDIENT_PROGRESS_TYPE_SYNTHESIZE:
					synthesizingCount++
				case models.INGREDIENT_PROGRESS_TYPE_RECLAIM:
					reclaimingCount++
				}
			}
			if 2 != producingCount {
				Logger.Error("KnapsackQuery#2 for progressList, there should be in total 2 producing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("producingCount", producingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 4 != synthesizingCount {
				Logger.Error("KnapsackQuery#2 for progressList, there should be in total 3 synthesizing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("synthesizingCount", synthesizingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 3 != reclaimingCount {
				Logger.Error("KnapsackQuery#2 for progressList, there should be in total 3 reclaiming ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("reclaimingCount", reclaimingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			Logger.Info("KnapsackQuery#2 for progressList done")
		}
    {
			cancelRespIns := _cancelIngredientProgress(chosenTesterName, intAuthToken, protocol, hostAndPort, toCancelSynthesizingProgressId, "1")
			Logger.Info("Unmarshalled resp.Body info", zap.Any("cancelRespIns.Ret", cancelRespIns.Ret))
    }

		time.Sleep(time.Duration(5000 * 1000000)) // In nanoseconds
		{
			knapsackQueryRespStructIns := _queryKnapsack(chosenTesterName, intAuthToken, protocol, hostAndPort)
			if 6 != len(knapsackQueryRespStructIns.IngredientProgressList) {
				Logger.Error("KnapsackQuery#3 for progressList, there should be in total 5 ongoing ingredient_progress", zap.Any("player", chosenTesterName))
				for _, progress := range knapsackQueryRespStructIns.IngredientProgressList {
					Logger.Info("", zap.Any("", progress))
				}
				t.FailNow()
			}
			producingCount := 0
			synthesizingCount := 0
			reclaimingCount := 0
			for _, item := range knapsackQueryRespStructIns.IngredientProgressList {
				switch item.ProgressType {
				case models.INGREDIENT_PROGRESS_TYPE_PRODUCE:
					producingCount++
				case models.INGREDIENT_PROGRESS_TYPE_SYNTHESIZE:
					synthesizingCount++
				case models.INGREDIENT_PROGRESS_TYPE_RECLAIM:
					reclaimingCount++
				}
			}
			if 1 != producingCount {
				Logger.Error("KnapsackQuery#3 for progressList, there should be in total 1 producing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("producingCount", producingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 2 != synthesizingCount {
				Logger.Error("KnapsackQuery#3 for progressList, there should be in total 2 synthesizing ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("synthesizingCount", synthesizingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			if 3 != reclaimingCount {
				Logger.Error("KnapsackQuery#3 for progressList, there should be in total 2 reclaiming ingredient_progress", zap.Any("player", chosenTesterName), zap.Any("reclaimingCount", reclaimingCount), zap.Any("knapsackQueryRespStructIns", knapsackQueryRespStructIns))
				t.FailNow()
			}
			Logger.Info("KnapsackQuery#3 for progressList done")
		}

    {
			cancelRespIns := _cancelIngredientProgress(chosenTesterName, intAuthToken, protocol, hostAndPort, toCancelReclaimingProgressId, "1")
			Logger.Info("Unmarshalled resp.Body info", zap.Any("cancelRespIns.Ret", cancelRespIns.Ret))
    }
	}

	theWaitGroup.Add(1)
	go commonFirstStep(fixedCountryCode, chosenTesterName, commonSecondStep, thirdStep)
	theWaitGroup.Wait()
}
