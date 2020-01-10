package models

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"server/storage"
)

type MissionRewardBinding struct {
	ID              int32 `json:"-" db:"id"`
	MissionID       int32 `json:"-" db:"mission_id"`
	AddValue        int32 `json:"addValue" db:"add_value"`
	AddResourceType int32 `json:"addResourceType" db:"add_resource_type"`
}

func (mgb *MissionRewardBinding) Insert(tx *sqlx.Tx) error {
	_, err := txInsert(tx, TBL_MISSION_REWARD_BINDING, []string{"mission_id", "add_resource_type", "add_value"}, []interface{}{mgb.MissionID, mgb.AddResourceType, mgb.AddValue})
	if err != nil {
		return err
	}
	if err != nil {
		return err
	}
	return nil
}

func GetMissionRewardBindingListByMissionId(tx *sqlx.Tx, missionId int32) ([]*MissionRewardBinding, error) {
	var tmp []*MissionRewardBinding
	err := getList(tx, TBL_MISSION_REWARD_BINDING, sq.Eq{"mission_id": missionId}, &tmp)
	if err == sql.ErrNoRows {
		return nil, err
	}
	return tmp, nil
}

func GetMissionRewardBindingListByMissionIds(missionIds []int32) ([]*MissionRewardBinding, error) {
	var tmp []*MissionRewardBinding
	query, args, err := sqlx.In("select * from mission_reward_binding where mission_id in (?)", missionIds)
	if err != nil {
		return nil, err
	}
	err = storage.MySQLManagerIns.Select(&tmp, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return tmp, nil
}
