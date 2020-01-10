package models

import (
	"fmt"
	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"server/common/utils"
	pb "server/pb_output"
	"encoding/base64"
	"github.com/golang/protobuf/proto"
)

type PlayerStageBinding struct {
	Id                int32  `json:"id" db:"id"`
	PlayerId          int32  `json:"playerId" db:"player_id"`
	StageId           int32  `json:"stageId" db:"stage_id"`
	State             int32  `json:"state" db:"state"`
	HighestScore      int32  `json:"highestScore" db:"highest_score"`
	HighestStars      int32  `json:"highestStars" db:"highest_stars"`
	UpdatedAt         int64  `json:"-" db:"updated_at"`
	CreatedAt         int64  `json:"-" db:"created_at"`
	PBEncodedSyncData string `db:"pb_encoded_sync_data"`
}

const (
  STAGE_LOCKED = 0
  STAGE_UNLOCKED_BY_STARS = 1
  STAGE_UNLOCKED_BY_DIAMONDS = 2
  STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE = 3
)

func AddPlayerStageBinding(
	tx *sqlx.Tx,
	playerId int32,
	stageId int32,
	state int32) error {
	exist, err := txExist(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId})
	if err != nil {
		return err
	}
	if exist {
		return nil
	}

	exist, err = txExist(tx, TBL_STAGE_INITIAL_STATE, squirrel.Eq{"stage_id": stageId})
	if !exist {
		return nil
	}

	now := utils.UnixtimeMilli()
	_, err = txInsert(tx, TBL_PLAYER_STAGE_BINDING,
		[]string{"player_id", "stage_id", "state", "updated_at", "created_at", "pb_encoded_sync_data"},
		[]interface{}{playerId, stageId, state, now, now, ""})

	if err != nil {
		return err
	}
	return nil
}

func UpdatePlayerStageBinding(
	tx *sqlx.Tx,
	playerId int32,
	stageId int32,
	score int32,
	stars int32) error {
	var playerStageBinding PlayerStageBinding

	err := txGetObjForUpdate(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId}, &playerStageBinding)

	if err != nil {
		return err
	}

	highestScore := score
	if playerStageBinding.HighestScore > highestScore {
		highestScore = playerStageBinding.HighestScore
	}

	highestStars := stars
	if playerStageBinding.HighestStars >= highestStars {
		highestStars = playerStageBinding.HighestStars
	} else {
		var player Player
		err := txGetObjForUpdate(tx, TBL_PLAYER, squirrel.Eq{"id": playerId}, &player)
		if err != nil {
			return err
		}

		incrementQBaseStr := fmt.Sprintf("UPDATE %s SET star=star+? WHERE id=?", TBL_PLAYER)
		incrementQ, err := tx.Preparex(incrementQBaseStr)
		if nil != err {
			return err
		}
		_, err = incrementQ.Exec(stars-playerStageBinding.HighestStars, playerId)
		if nil != err {
			return err
		}
	}

	updateQBaseStr := fmt.Sprintf("UPDATE %s SET highest_score=?,highest_stars=?,updated_at=? WHERE player_id=? and stage_id=?", TBL_PLAYER_STAGE_BINDING)
	updateQ, err := tx.Preparex(updateQBaseStr)
	if err != nil {
		return err
	}
	now := utils.UnixtimeMilli()
	_, err = updateQ.Exec(highestScore, highestStars, now, playerId, stageId)
	if err != nil {
		return err
	}
	return nil
}

func TerminatePlayerStage(
	tx *sqlx.Tx,
	playerId int32,
	stageId int32,
	score int32,
	stars int32) (*PlayerStageBinding, error) {

	err := UpdatePlayerStageBinding(tx, playerId, stageId, score, stars)
	if err != nil {
		return nil, err
	}

	var stageInitialState StageInitialState
	err = txGetObj(tx, TBL_STAGE_INITIAL_STATE, squirrel.Eq{"stage_id": stageId}, &stageInitialState)
	if err != nil {
		return nil, err
	}

  var pbDecodedStageInitialStateConf pb.StageInitialState
  decoded, _ := base64.StdEncoding.DecodeString(stageInitialState.PbB64EncodedData)
  _ = proto.Unmarshal(decoded, &pbDecodedStageInitialStateConf)

  _, err = IncrementPlayerHoldings(tx, playerId, -pbDecodedStageInitialStateConf.TicketPrice, 0)
	if err != nil {
		return nil, err
	}


	if score >= stageInitialState.PassScore {
		nextStageExist, err := txExist(tx, TBL_STAGE_INITIAL_STATE, squirrel.Eq{"stage_id": stageId + 1})
		if err != nil {
			return nil, err
		}
		if !nextStageExist {
			return nil, nil
		}

		var nextStageInitialState StageInitialState
		err = txGetObj(tx, TBL_STAGE_INITIAL_STATE, squirrel.Eq{"stage_id": stageId + 1}, &nextStageInitialState)
		if err != nil {
			return nil, err
		}

		/*
    * Uncomment the immediately following snippet and comment out the next following snippet if a "manual unlock of next stage" is expected.
    *
    * -- YFLu, 2019-11-27.
    */
    // if nextStageInitialState.DiamondPrice == 0 && nextStageInitialState.StarPrice == 0 {
    //   err = AddPlayerStageBinding(tx, playerId, stageId+1, STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE)
    //   if err != nil {
    //     return err
    //   }
    // }

		err = AddPlayerStageBinding(tx, playerId, stageId+1, STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE)
		if err != nil {
			return nil, err
		}

		newStageBinding, err := GetPlayerStageBindingByPlayerAndStage(tx, playerId, stageId+1)
		if err != nil {
			return nil, err
		}
		return newStageBinding, nil
	}
	return nil, nil
}

func GetPlayerStageBindingByPlayerId(tx *sqlx.Tx, playerId int32) ([]*PlayerStageBinding, error) {
	var resList []*PlayerStageBinding
	err := getList(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId}, &resList)
	if err != nil {
		return nil, err
	}

	return resList, nil
}

func CheckPlayerStageBindingExist(tx *sqlx.Tx, playerId int32, stageId int32) (bool, error) {
	return txExist(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId})
}

func GetPlayerStageBindingByPlayerAndStage(tx *sqlx.Tx, playerId int32, stageId int32) (*PlayerStageBinding, error) {
	var res PlayerStageBinding
	exist, err := txExist(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId})
	if err != nil || !exist {
		return nil, err
	}

	err = txGetObj(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId}, &res)
	if err != nil {
		return nil, err
	}

	return &res, nil
}

func CheckDiamondRequirementForStagePurchase(tx *sqlx.Tx, playerId int32, requiredDiamond int32) (bool, error) {
	var player Player
	err := txGetObjForUpdate(tx, TBL_PLAYER, squirrel.Eq{"id": playerId}, &player)
	if err != nil {
		return false, err
	}

	return player.Diamond >= requiredDiamond, nil
}

func CheckStarRequirementForStagePurchase(tx *sqlx.Tx, playerId int32, requiredStar int32) (bool, error) {
	var player Player
	err := txGetObjForUpdate(tx, TBL_PLAYER, squirrel.Eq{"id": playerId}, &player)
	if err != nil {
		return false, err
	}

	return player.Star >= requiredStar, nil
}

func PurchaseStageByDiamond(tx *sqlx.Tx, playerId int32, stageId int32) error {
	exist, err := txExist(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId})
	if err != nil {
		return err
	}
	if exist {
		return nil
	}

	stage, err := GetStageInitialStateDataByStageId(tx, stageId)
	if err != nil {
		return err
	}

	decrementQBaseStr := fmt.Sprintf("UPDATE %s SET diamond= CASE WHEN diamond>=? THEN diamond-? ELSE 0 END WHERE id=?", TBL_PLAYER)
	decrementQ, err := tx.Preparex(decrementQBaseStr)
	if nil != err {
		return err
	}
	_, err = decrementQ.Exec(stage.DiamondPrice, stage.DiamondPrice, playerId)
	if nil != err {
		return err
	}

	err = AddPlayerStageBinding(tx, playerId, stageId, STAGE_UNLOCKED_BY_DIAMONDS)
	if nil != err {
		return err
	}
	return nil
}

func PurchaseStageByStar(tx *sqlx.Tx, playerId int32, stageId int32) error {
	exist, err := txExist(tx, TBL_PLAYER_STAGE_BINDING, squirrel.Eq{"player_id": playerId, "stage_id": stageId})
	if err != nil {
		return err
	}
	if exist {
		return nil
	}

	stage, err := GetStageInitialStateDataByStageId(tx, stageId)
	if err != nil {
		return err
	}

	decrementQBaseStr := fmt.Sprintf("UPDATE %s SET star= CASE WHEN star>=? THEN star-? ELSE 0 END WHERE id=?", TBL_PLAYER)
	decrementQ, err := tx.Preparex(decrementQBaseStr)
	if nil != err {
		return err
	}
	_, err = decrementQ.Exec(stage.StarPrice, stage.StarPrice, playerId)
	if nil != err {
		return err
	}

	err = AddPlayerStageBinding(tx, playerId, stageId, STAGE_UNLOCKED_BY_STARS)
	if nil != err {
		return err
	}
	return nil
}
