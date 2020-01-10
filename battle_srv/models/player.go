package models

import (
	"database/sql"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"server/api"
	"server/common/utils"
	"time"
	"go.uber.org/zap"
	. "server/common"
)

type Player struct {
	CreatedAt                 int64      `json:"created_at" db:"created_at"`
	DeletedAt                 NullInt64  `json:"deleted_at" db:"deleted_at"`
	DisplayName               NullString `json:"display_name" db:"display_name"`
	ID                        int32      `json:"id" db:"id"`
	Name                      string     `json:"name" db:"name"`
	Diamond                   int32      `json:"diamond" db:"diamond"`
	Star                      int32      `json:"star" db:"star"`
	UpdatedAt                 int64      `json:"updated_at" db:"updated_at"`
	UnlockedMaps              string     `json:"unlockedMaps" db:"unlocked_maps"`
	LastSuccessfulCheckInAt   NullInt64  `json:"lastSuccessfulCheckInAt" db:"last_successful_check_in_at"`
	InterruptTutorialMask     string     `json:"interruptTutorialMask" db:"interrupt_tutorial_mask"`
	DiamondLastAutoFillAt     NullInt64  `json:"-" db:"diamond_last_auto_fill_at"`
	DiamondAutoFillUpperLimit int32      `json:"-" db:"diamond_auto_fill_upper_limit"`
}

const AD_VIDEO_ENDED_DIAMOND_REWARD = 10

const (
	FIRST_STATE = 1
	LAST_STATE  = 4
)

func ExistPlayerByName(tx *sqlx.Tx, name string) (bool, error) {
	if nil == tx {
		return exist("player", sq.Eq{"name": name, "deleted_at": nil})
	} else {
		return txExist(tx, "player", sq.Eq{"name": name, "deleted_at": nil})
	}
}

func GetPlayerByName(tx *sqlx.Tx, name string) (*Player, error) {
	return getPlayer(sq.Eq{"name": name, "deleted_at": nil}, tx)
}

func GetPlayerById(id int32, tx *sqlx.Tx) (*Player, error) {
	return getPlayer(sq.Eq{"id": id, "deleted_at": nil}, tx)
}

func getPlayer(cond sq.Eq, tx *sqlx.Tx) (*Player, error) {
	var p Player
	var err error
	if nil == tx {
		err = getObj("player", cond, &p)
	} else {
		err = txGetObj(tx, "player", cond, &p)
	}
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, err
}

func (p *Player) Insert(tx *sqlx.Tx) error {
	confMap, err := api.LoadGlobalConfMap()
	if err != nil {
		return err
	}
	diamondAutoFillUpperLimit := 10
	pDiamondAutoFillUpperLimit := confMap["diamondAutoFillUpperLimit"]
	if pDiamondAutoFillUpperLimit != nil {
		diamondAutoFillUpperLimit = int(pDiamondAutoFillUpperLimit.(float64))
	}
	result, err := txInsert(tx, "player", []string{"name", "display_name", "diamond", "created_at", "updated_at", "diamond_auto_fill_upper_limit"},
		[]interface{}{p.Name, p.DisplayName, p.Diamond, p.CreatedAt, p.UpdatedAt, diamondAutoFillUpperLimit})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	p.ID = int32(id)
	return nil
}

func UpdatePlayerTutorialStage(tx *sqlx.Tx, playerId int32, tutorialStage int32) (bool, error) {
	query, args, err := sq.Update("player").
		Set("tutorial_stage", tutorialStage).
		Where(sq.Eq{"tutorial_stage": tutorialStage - 1, "id": playerId}).ToSql()
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	return rowsAffected >= 1, nil
}

func UpdatePlayerInterruptTutorialMask(tx *sqlx.Tx, playerId int32, interruptTutorialMask string) (int64, error) {
	updateBaseStr := fmt.Sprintf("UPDATE %s SET interrupt_tutorial_mask= ? WHERE id=?", TBL_PLAYER)
	updateQ, err := tx.Preparex(updateBaseStr)
	if nil != err {
		return 0, err
	}
	updateedResult := updateQ.MustExec(interruptTutorialMask, playerId)
	return updateedResult.RowsAffected()
}

func UpdatePlayerDiamondHolding(tx *sqlx.Tx, playerId int32, diamond int32) (int64, error) {
	updateBaseStr := fmt.Sprintf("UPDATE %s SET diamond= ? WHERE id=?", TBL_PLAYER)
	updateQ, err := tx.Preparex(updateBaseStr)
	if nil != err {
		return 0, err
	}
	updateedResult := updateQ.MustExec(diamond, playerId)
	return updateedResult.RowsAffected()
}

func IncrementPlayerHoldings(tx *sqlx.Tx, playerId int32, diamondDiff int32, starDiff int32) (int64, error) {
	incrementBaseStr := fmt.Sprintf("UPDATE %s SET diamond= CASE WHEN diamond+?>=0 THEN diamond+? ELSE 0 END, star= CASE WHEN star+?>=0 THEN star+? ELSE 0 END WHERE id=?", TBL_PLAYER)
	incrementQ, err := tx.Preparex(incrementBaseStr)
	if nil != err {
		return 0, err
	}
	incrementedResult := incrementQ.MustExec(diamondDiff, diamondDiff, starDiff, starDiff, playerId)
	return incrementedResult.RowsAffected()
}

func PlayerCheckIn(tx *sqlx.Tx, playerId int32) (int64, error) {
	var player Player
	err := txGetObjForUpdate(tx, TBL_PLAYER, sq.Eq{"id": playerId}, &player)
	if nil != err {
		return 0, err
	}
	now := utils.UnixtimeMilli()

	if player.LastSuccessfulCheckInAt.Valid {
		if CheckIsToday(now, player.LastSuccessfulCheckInAt.Int64) {
			return player.LastSuccessfulCheckInAt.Int64, nil
		}
	}

	updateBaseStr := fmt.Sprintf("UPDATE %s SET last_successful_check_in_at= ? WHERE id=?", TBL_PLAYER)
	updateQ, err := tx.Preparex(updateBaseStr)
	if nil != err {
		return 0, err
	}
	_, err = updateQ.Exec(now, playerId)
	return now, err
}

func CheckIsToday(timestampA int64, timestampB int64) bool {
	location, _ := time.LoadLocation("")
	dateA := time.Unix(timestampA/1000, 0).In(location)
	dateB := time.Unix(timestampB/1000, 0).In(location)
	return dateA.Day() == dateB.Day() && dateA.Month() == dateB.Month() && dateA.Year() == dateB.Year()
}

func CheckDiamondAutoFillFeasibilityAndFillIfPossible(tx *sqlx.Tx, playerId int32) (int32, error) {
	var player Player
	err := txGetObjForUpdate(tx, TBL_PLAYER, sq.Eq{"id": playerId}, &player)
	if err != nil {
		return 0, err
	}
	var autoFillDiamond int32 = 15

  // autoFillDiamondIntervalMillis := int64(3)
  autoFillDiamondIntervalMillis := int64(24*60*60*1000)

	now := utils.UnixtimeMilli()

	if !player.DiamondLastAutoFillAt.Valid ||
		now-player.DiamondLastAutoFillAt.Int64 > autoFillDiamondIntervalMillis {

    Logger.Info("CheckDiamondAutoFillFeasibilityAndFillIfPossible, about to carry out diamond-autofill", zap.Any("playerId", playerId), zap.Any("now", now), zap.Any("player.DiamondLastAutoFillAt", player.DiamondLastAutoFillAt), zap.Any("now-player.DiamondLastAutoFillAt.Int64", now-player.DiamondLastAutoFillAt.Int64))

		incrementBaseStr := fmt.Sprintf("UPDATE %s SET diamond= CASE WHEN diamond+?>=0 THEN (CASE WHEN diamond+? > diamond_auto_fill_upper_limit THEN diamond_auto_fill_upper_limit ELSE diamond+? END) ELSE 0 END, diamond_last_auto_fill_at=? WHERE id=?", TBL_PLAYER)
		incrementQ, err := tx.Preparex(incrementBaseStr)
		if nil != err {
      Logger.Error("CheckDiamondAutoFillFeasibilityAndFillIfPossible", zap.Any("playerId", playerId), zap.Error(err))
			return 0, err
		}
		incrementedResult := incrementQ.MustExec(autoFillDiamond, autoFillDiamond, autoFillDiamond, now, playerId)
		_, err = incrementedResult.RowsAffected()
		if nil != err {
      Logger.Error("CheckDiamondAutoFillFeasibilityAndFillIfPossible", zap.Any("playerId", playerId), zap.Error(err))
			return 0, err
		}

		return autoFillDiamond, nil
	}

	return 0, nil
}
