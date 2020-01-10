package models

import (
  "fmt"
	"server/common/utils"
	"encoding/base64"
	sq "github.com/Masterminds/squirrel"
	"github.com/golang/protobuf/proto"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	pb "server/pb_output"
)

type StageInitialState struct {
	Id               int32  `json:"id" db:"id"`
	StageId          int32  `json:"stageId" db:"stage_id"`
	PbB64EncodedData string `json:"pbEncodedData" db:"pb_b64_encoded_data"`
	PassScore        int32  `json:"passScore" db:"pass_score"`
	DiamondPrice     int32  `json:"diamondPrice" db:"diamond_price"` // This is the diamond price for "unlocking the stage" if "manual unlock" is expected, whilst "PbB64EncodedData.ticketPrice" is the diamond price for "playing the unlocked stage once" regardless of the "manual/auto unlock scheme". 
	StarPrice        int32  `json:"starPrice" db:"star_price"`
  TicketPrice      int32  `json:"ticketPrice" db:"ticket_price"`
}

func (p *StageInitialState) Insert(tx *sqlx.Tx) error {
	b64Decoded, err := base64.StdEncoding.DecodeString(p.PbB64EncodedData)
	if err != nil {
		panic(err)
	}
	var data pb.StageInitialState
	err = proto.Unmarshal(b64Decoded, &data)
	if err != nil {
		panic(err)
	}
	Logger.Info("StageInitialState.Insert, decoded data ", zap.Any("data", data))
	result, err := txInsert(tx, TBL_STAGE_INITIAL_STATE, []string{"id", "stage_id", "pb_b64_encoded_data", "pass_score", "diamond_price", "star_price"},
		[]interface{}{p.Id, p.StageId, p.PbB64EncodedData, data.Goal.PassScore, data.DiamondPrice, data.StarPrice})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	p.Id = int32(id)
	return nil
}

func GetStageInitialStateDataByStageId(tx *sqlx.Tx, stageId int32) (*pb.StageInitialState, error) {
	var data StageInitialState
	err := txGetObj(tx, TBL_STAGE_INITIAL_STATE, sq.Eq{"stage_id": stageId}, &data)
	if err != nil {
		return nil, err
	}

	b64Decoded, err := base64.StdEncoding.DecodeString(data.PbB64EncodedData)
	if err != nil {
		panic(err)
	}
	var res pb.StageInitialState
	err = proto.Unmarshal(b64Decoded, &res)
	if err != nil {
		panic(err)
	}

	return &res, nil
}

func UpsertPlayerSyncDataToPlayerStageBinding(tx *sqlx.Tx, playerId int32, stageId int32, syncDataStrB64Encoded string) (int64, error) {
	nowMills := utils.UnixtimeMilli()
	upsertQBaseStr := fmt.Sprintf("INSERT INTO %s (player_id, stage_id, state, pb_encoded_sync_data, created_at, updated_at) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE pb_encoded_sync_data=?", TBL_PLAYER_STAGE_BINDING)
	upsertQ, localErr := tx.Preparex(upsertQBaseStr)
	if localErr != nil {
		return 0, localErr
	}
	upsertedResult := upsertQ.MustExec(playerId, stageId, STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE, syncDataStrB64Encoded, nowMills, nowMills, syncDataStrB64Encoded)
  return upsertedResult.RowsAffected()
}

func InsertPlayerStageCache(tx *sqlx.Tx, playerId int32, data *pb.StageInitialState) error {
	syncDataByteArr, err := proto.Marshal(data.SyncData)
	if err != nil {
		return err
	}
	syncDataStrB64Encoded := base64.StdEncoding.EncodeToString(syncDataByteArr)
	_, err = UpsertPlayerSyncDataToPlayerStageBinding(tx, playerId, data.StageId, syncDataStrB64Encoded)
	if nil != err {
		return err
	}

	return nil
}

func DeletePlayerStageCache(tx *sqlx.Tx, playerId int32) error {
  /*
  Deliberately not deleting anything at the "per-player scope".
    
  -- YFLu, 2019-10-17.
  */
	return nil
}

func GetAllStageInitialState(tx *sqlx.Tx) ([]*StageInitialState, error) {
	var resList []*StageInitialState
	err := getList(tx, TBL_STAGE_INITIAL_STATE, sq.Eq{}, &resList)
	return resList, err
}
