package models

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type Mission struct {
	ID               int32    `json:"id" db:"id"`
	DependsOnBatchID int32    `json:"dependsOnBatchId" db:"depends_on_batch_id"`
	BatchID          int32    `json:"batchId" db:"batch_id"`
	Description      string   `json:"description" db:"description"`
	Reproductive     int32    `json:"reproductive" db:"reproductive"`
	QuestList        []*Quest `json:"questList"`
	Type             int32    `json:"type" db:"type"`
}

type Quest struct {
	ID                     int32  `json:"id" db:"id"`
	MissionID              int32  `json:"missionId" db:"mission_id"`
	Content                string `json:"content" db:"content"`
	ResourceType           int32  `json:"resourceType" db:"resource_type"`
	ResourceTargetID       int32  `json:"resourceTargetId" db:"resource_target_id"`
	ResourceTargetQuantity int32  `json:"resourceTargetQuantity" db:"resource_target_quantity"`
	CompletedCountRequired int32  `json:"completedCountRequired" db:"completed_count_required"`
}

const NORMAL_MISSION = 0
const DAILY_MISSION = 2
const MISSION_TYPE_DEFAULT = 0
const MISSION_TYPE_ACHIEVEMENT = 1

func (m *Mission) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_MISSION,
		[]string{"id", "depends_on_batch_id", "batch_id", "description", "reproductive", "type"},
		[]interface{}{m.ID, m.DependsOnBatchID, m.BatchID, m.Description, m.Reproductive, m.Type})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	m.ID = int32(id)
	return nil
}

func (q *Quest) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "quest", []string{
		"id",
		"mission_id",
		"content",
		"resource_type",
		"resource_target_id",
		"resource_target_quantity",
		"completed_count_required",
	}, []interface{}{
		q.ID,
		q.MissionID,
		q.Content,
		q.ResourceType,
		q.ResourceTargetID,
		q.ResourceTargetQuantity,
		q.CompletedCountRequired,
	})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	q.ID = int32(id)
	return nil
}

func GetMissionById(tx *sqlx.Tx, id int32) (*Mission, error) {
	var tmp Mission
	err := txGetObj(tx, TBL_MISSION, sq.Eq{"id": id}, &tmp)
	if err == sql.ErrNoRows {
		return nil, err
	}
	return &tmp, nil
}

func getMissionIds(p []*Mission) *[]int32 {
	res := make([]int32, len(p))
	for i, binding := range p {
		res[i] = binding.ID
	}
	return &res
}

func GetDailyMission(tx *sqlx.Tx) ([]*Mission, error) {
	var tmp []*Mission

	query, args, err := sq.Select("*").
		From(TBL_MISSION).
		Where(sq.Eq{"reproductive": DAILY_MISSION, "type": MISSION_TYPE_DEFAULT}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err != nil {
		return nil, err
	}

	if len(tmp) < 1 {
		return nil, nil
	}

	ids := getMissionIds(tmp)

	var quests []*Quest
	query, args, err = sqlx.In("select * from quest where mission_id in (?)", *ids)
	if err != nil {
		return nil, err
	}
	err = tx.Select(&quests, query, args...)
	if err != nil {
		return nil, err
	}

	for _, mission := range tmp {
		for _, quest := range quests {
			if mission.ID == quest.MissionID {
				mission.QuestList = append(mission.QuestList, quest)
			}
		}
	}

	return tmp, nil
}

func GetAchievementByBatchId(tx *sqlx.Tx, batchID int32) ([]*Mission, error) {
	var tmp []*Mission

	query, args, err := sq.Select("*").
		From(TBL_MISSION).
		Where(sq.Eq{"depends_on_batch_id": batchID, "reproductive": NORMAL_MISSION, "type": MISSION_TYPE_ACHIEVEMENT}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err != nil {
		return nil, err
	}

	if len(tmp) < 1 {
		return nil, nil
	}

	ids := getMissionIds(tmp)

	var quests []*Quest
	query, args, err = sqlx.In("select * from quest where mission_id in (?)", *ids)
	if err != nil {
		return nil, err
	}
	err = tx.Select(&quests, query, args...)
	if err != nil {
		return nil, err
	}

	for _, mission := range tmp {
		for _, quest := range quests {
			if mission.ID == quest.MissionID {
				mission.QuestList = append(mission.QuestList, quest)
			}
		}
	}

	return tmp, nil
}

func GetMissionByBatchID(tx *sqlx.Tx, batchID int32) ([]*Mission, error) {
	var tmp []*Mission

	query, args, err := sq.Select("*").
		From(TBL_MISSION).
		Where(sq.Eq{"batch_id": batchID, "reproductive": NORMAL_MISSION, "type": MISSION_TYPE_DEFAULT}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err != nil {
		return nil, err
	}

	if len(tmp) < 1 {
		return nil, nil
	}

	ids := getMissionIds(tmp)

	var quests []*Quest
	query, args, err = sqlx.In("select * from quest where mission_id in (?)", *ids)
	if err != nil {
		return nil, err
	}
	err = tx.Select(&quests, query, args...)
	if err != nil {
		return nil, err
	}

	for _, mission := range tmp {
		for _, quest := range quests {
			if mission.ID == quest.MissionID {
				mission.QuestList = append(mission.QuestList, quest)
			}
		}
	}

	return tmp, nil
}
