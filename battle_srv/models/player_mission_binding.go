package models

import (
	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	pb "server/pb_output"
	"server/storage"
)

type PlayerQuestBinding struct {
	ID                     int32     `json:"id" db:"id"`
	PlayerID               int32     `json:"-" db:"player_id"`
	QuestID                int32     `json:"-" db:"quest_id"`
	CompletedCount         int32     `json:"completedCount" db:"completed_count"`
	Content                string    `json:"content" db:"content"`
	MissionID              int32     `json:"-" db:"mission_id"`
	ResourceType           int32     `json:"resourceType" db:"resource_type"`
	ResourceTargetId       int32     `json:"resourceTargetId" db:"resource_target_id"`
	ResourceTargetQuantity int32     `json:"resourceTargetQuantity" db:"resource_target_quantity"`
	CompletedCountRequired int32     `json:"completedCountRequired" db:"completed_count_required"`
	UpdatedAt              int64     `json:"-" db:"updated_at"`
	CreatedAt              int64     `json:"-" db:"created_at"`
	DeletedAt              NullInt64 `json:"-" db:"deleted_at"`
}

type PlayerMissionBinding struct {
	ID               int32                   `json:"id" db:"id"`
	PlayerID         int32                   `json:"-" db:"player_id"`
	MissionID        int32                   `json:"missionId" db:"mission_id"`
	BatchID          int32                   `json:"-" db:"batch_id"`
	DependsOnBatchID int32                   `json:"dependsOnBatchId" db:"depends_on_batch_id"`
	CompleteState    int32                   `json:"state" db:"complete_state"`
	Description      string                  `json:"description" db:"description"`
	Reproductive     int32                   `json:"reproductive" db:"reproductive"`
	Type             int32                   `json:"type" db:"type"`
	UpdatedAt        int64                   `json:"-" db:"updated_at"`
	CreatedAt        int64                   `json:"-" db:"created_at"`
	DeletedAt        NullInt64               `json:"-" db:"deleted_at"`
	QuestList        []*PlayerQuestBinding   `json:"playerQuestBindingList"`
	GiftList         []*MissionRewardBinding `json:"giftList"`
}

var (
	NOT_COMPLETED      int32 = 0
	COMPLETED          int32 = 1
	COMPLETED_OBTAINED int32 = 2
	CLAIMED_IN_UPSYNC  int32 = 3
)

var (
	GOLD                     int32 = 0
	STATEFUL_BUILDABLE_LEVEL int32 = 1
	DIAMOND                  int32 = 2
	RECIPE_UNLOCK            int32 = 3
	INGREDIENT_UNLOCK        int32 = 4
	SERVED_CUSTOMER          int32 = 5
	DISH_SOLD                int32 = 6
	INGREDIENT_PRODUCE       int32 = 7
	FREE_ORDER_INCOME        int32 = 8
)

func getBindingMissionIds(p []*PlayerMissionBinding) []int32 {
	res := make([]int32, len(p))
	for i, binding := range p {
		res[i] = binding.MissionID
	}
	return res
}

func GetPlayerMissionListBindingByPlayerId(tx *sqlx.Tx, playerID int32) ([]*PlayerMissionBinding, error) {
	var tmp []*PlayerMissionBinding
	query, args, err := sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.Eq{"player_id": playerID}).
		OrderBy("complete_state asc, updated_at desc").
		ToSql()
	Logger.Debug("getList", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return nil, err
	}
	if tx == nil {
		err = storage.MySQLManagerIns.Select(&tmp, query, args...)
	} else {
		err = tx.Select(&tmp, query, args...)
	}
	if err == sql.ErrNoRows {
		return nil, nil
	}
	getQuests(tx, tmp, playerID)

	missionIds := getBindingMissionIds(tmp)
	gifts, err := GetMissionRewardBindingListByMissionIds(missionIds)

	for _, binding := range tmp {
		for _, gift := range gifts {
			if binding.MissionID == gift.MissionID {
				binding.GiftList = append(binding.GiftList, gift)
			}
		}
	}

	return tmp, nil
}

func getQuests(tx *sqlx.Tx, p []*PlayerMissionBinding, playerID int32) error {
	var tmp []*PlayerQuestBinding

	query, args, err := sq.Select("*").
		From(TBL_PLAYER_QUEST_BINDING).
		Where(sq.Eq{"player_id": playerID}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil
	}

	for _, item := range tmp {
		for _, binding := range p {
			if item.MissionID == binding.MissionID {
				binding.QuestList = append(binding.QuestList, item)
			}
		}
	}

	return nil
}

func addMissionsToPlayer(tx *sqlx.Tx, missions []*Mission, playerID int32) error {
	now := utils.UnixtimeMilli()
	for _, p := range missions {
		_, err := txInsert(tx, TBL_PLAYER_MISSION_BINDING,
			[]string{
				"player_id",
				"mission_id",
				"batch_id",
				"depends_on_batch_id",
				"description",
				"complete_state",
				"reproductive",
				"type",
				"created_at",
				"updated_at",
			},
			[]interface{}{
				playerID,
				p.ID,
				p.BatchID,
				p.DependsOnBatchID,
				p.Description,
				0,
				p.Reproductive,
				p.Type,
				now,
				now,
			})

		if err != nil {
			return err
		}

		for _, q := range p.QuestList {
			_, err := txInsert(tx, TBL_PLAYER_QUEST_BINDING,
				[]string{
					"player_id",
					"quest_id",
					"completed_count",
					"content",
					"mission_id",
					"resource_type",
					"resource_target_id",
					"resource_target_quantity",
					"completed_count_required",
					"created_at",
					"updated_at",
				},
				[]interface{}{
					playerID,
					q.ID,
					0,
					q.Content,
					q.MissionID,
					q.ResourceType,
					q.ResourceTargetID,
					q.ResourceTargetQuantity,
					q.CompletedCountRequired,
					now,
					now,
				})

			if err != nil {
				return err
			}
		}
	}

	return nil
}

func addAchievementsToPlayer(
	tx *sqlx.Tx,
	missions []*Mission,
	playerID int32,
	syncData *pb.SyncDataStruct,
	buildableBindingMap map[int32][]*pb.PlayerBuildableBinding,
	playerRecipeMap map[int32]*PlayerRecipe,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) error {
	now := utils.UnixtimeMilli()
	for _, p := range missions {
		_, err := txInsert(tx, TBL_PLAYER_MISSION_BINDING,
			[]string{
				"player_id",
				"mission_id",
				"batch_id",
				"depends_on_batch_id",
				"description",
				"complete_state",
				"reproductive",
				"type",
				"created_at",
				"updated_at",
			},
			[]interface{}{
				playerID,
				p.ID,
				p.BatchID,
				p.DependsOnBatchID,
				p.Description,
				0,
				p.Reproductive,
				p.Type,
				now,
				now,
			})

		if err != nil {
			return err
		}

		for _, q := range p.QuestList {
			_, err := txInsert(tx, TBL_PLAYER_QUEST_BINDING,
				[]string{
					"player_id",
					"quest_id",
					"completed_count",
					"content",
					"mission_id",
					"resource_type",
					"resource_target_id",
					"resource_target_quantity",
					"completed_count_required",
					"created_at",
					"updated_at",
				},
				[]interface{}{
					playerID,
					q.ID,
					getQuestCompletedCountByUpsyncData(q, syncData, buildableBindingMap, playerRecipeMap, playerIdleGameIngredientMap),
					q.Content,
					q.MissionID,
					q.ResourceType,
					q.ResourceTargetID,
					q.ResourceTargetQuantity,
					q.CompletedCountRequired,
					now,
					now,
				})

			if err != nil {
				return err
			}
		}
	}

	return nil
}

func getQuestCompletedCountByUpsyncData(
	quest *Quest,
	syncData *pb.SyncDataStruct,
	buildableBindingMap map[int32][]*pb.PlayerBuildableBinding,
	playerRecipeMap map[int32]*PlayerRecipe,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) int32 {
	if syncData == nil {
		return 0
	}
	switch quest.ResourceType {
	case GOLD:
		return syncData.Wallet.Gold
	case STATEFUL_BUILDABLE_LEVEL:
		var completedCount int32 = 0
		bindingList, ok := buildableBindingMap[quest.ResourceTargetID]
		if ok {
			for _, binding := range bindingList {
				if binding.GetCurrentLevel() >= quest.ResourceTargetQuantity {
					completedCount++
				}
			}
		}
		return completedCount
	case DIAMOND:
		return 0
	case INGREDIENT_UNLOCK:
		playerIngredient := playerIdleGameIngredientMap[quest.ResourceTargetID]
		if playerIngredient == nil {
			return 0
		}

		if playerIngredient.State == PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED {
			return 1
		}
		return 0
	case RECIPE_UNLOCK:
		playerRecipe := playerRecipeMap[quest.ResourceTargetID]
		if playerRecipe == nil {
			return 0
		}

		if playerRecipe.State == PLAYER_RECIPE_UNLOCKED {
			return 1
		}
		return 0
	case SERVED_CUSTOMER:
		return syncData.AccumulatedResource.ServedCustomer
	case DISH_SOLD:
		return syncData.AccumulatedResource.DishSold
	case INGREDIENT_PRODUCE:
		res, ok := syncData.AccumulatedResource.IngredientProduced[quest.ResourceTargetID]
		if !ok {
			return 0
		}
		return res
	case FREE_ORDER_INCOME:
		return syncData.AccumulatedResource.FreeOrderIncome
	}
	return 0
}

func UpdateMissionCompleteState(tx *sqlx.Tx, bindingID int32, completeState int32) error {
	now := utils.UnixtimeMilli()
	query, args, err := sq.Update(TBL_PLAYER_MISSION_BINDING).
		Set("complete_state", completeState).
		Set("updated_at", now).
		Where(sq.Eq{"id": bindingID}).
		ToSql()

	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	if err != nil {
		return err
	}
	return nil
}

func CanRewardObtain(tx *sqlx.Tx, missionBindingID int32) (bool, *PlayerMissionBinding, error) {
	var mission PlayerMissionBinding
	query, args, err := sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.Eq{"id": missionBindingID}).
		Limit(1).
		ToSql()
	if err != nil {
		return false, nil, err
	}
	err = tx.Get(&mission, query, args...)
	if err != nil {
		return false, nil, err
	}

	return mission.CompleteState == COMPLETED, &mission, nil
}

func GetPlayerMissionBindingIDList(tx *sqlx.Tx, playerID int32, completeStatus int32) ([]int32, error) {
	query, args, err := sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.And{sq.Eq{"player_id": playerID}, sq.Eq{"complete_state": completeStatus}}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return nil, err
	}

	var missions []*PlayerMissionBinding

	err = tx.Select(&missions, query, args...)
	if err != nil {
		return nil, err
	}

	res := make([]int32, len(missions))
	for i, binding := range missions {
		res[i] = binding.ID
	}
	return res, nil
}

func AllocateMissionForPlayerByBatchID(tx *sqlx.Tx, playerID int32, batchID int32) error {
	missions, err := GetMissionByBatchID(tx, batchID)
	if err != nil {
		return err
	}
	err = addMissionsToPlayer(tx, missions, playerID)

	if err != nil {
		return err
	}

	return nil
}

func AllocateAchievementForPlayerByBatchID(
	tx *sqlx.Tx,
	playerID int32,
	batchID int32,
	syncData *pb.SyncDataStruct,
	buildableBindingMap map[int32][]*pb.PlayerBuildableBinding,
	playerRecipeMap map[int32]*PlayerRecipe,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) error {
	missions, err := GetAchievementByBatchId(tx, batchID)
	if err != nil {
		return err
	}
	err = addAchievementsToPlayer(
		tx,
		missions,
		playerID,
		syncData,
		buildableBindingMap,
		playerRecipeMap,
		playerIdleGameIngredientMap,
	)

	if err != nil {
		return err
	}

	return nil
}

func CheckMissionCompletionAndAllocateIfApplicable(
	tx *sqlx.Tx,
	forPlayerId int32,
	preSyncData *pb.SyncDataStruct,
	syncData *pb.SyncDataStruct,
	prePlayerRecipeList []*PlayerRecipe,
	playerRecipeList []*PlayerRecipe,
	prePlayerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) (bool, error) {
	var maxBatchID int32
	query, args, err := sq.Select("COALESCE(MAX(batch_id),0)").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.Eq{"player_id": forPlayerId, "type": MISSION_TYPE_DEFAULT}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return false, err
	}
	err = tx.Get(&maxBatchID, query, args...)

	if err != nil {
		return false, err
	}

	query, args, err = sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.And{sq.Eq{"player_id": forPlayerId}, sq.Eq{"batch_id": maxBatchID, "type": MISSION_TYPE_DEFAULT}}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return false, err
	}

	var missions []*PlayerMissionBinding

	err = tx.Select(&missions, query, args...)
	if err != nil {
		return false, err
	}
	err = getQuests(tx, missions, forPlayerId)
	if err != nil {
		return false, err
	}

	buildableBindingMap := composeBuildableBindingMap(syncData)
	preBuildableBindingMap := composeBuildableBindingMap(preSyncData)
	playerRecipeMap := composePlayerRecipeMap(playerRecipeList)
	prePlayerRecipeMap := composePlayerRecipeMap(prePlayerRecipeList)

	hasMissionDone := false
	allDone := true
	for _, mission := range missions {
		if mission.CompleteState != NOT_COMPLETED {
			continue
		}
		isDone := true
		for _, quest := range mission.QuestList {
			if quest.CompletedCount == quest.CompletedCountRequired {
				continue
			}
			isQuestDone, err := checkIsQuestCompleted(
				tx,
				quest,
				preSyncData,
				syncData,
				preBuildableBindingMap,
				buildableBindingMap,
				prePlayerRecipeMap,
				playerRecipeMap,
				prePlayerIdleGameIngredientMap,
				playerIdleGameIngredientMap,
			)
			if err != nil {
				return false, err
			}
			if !isQuestDone {
				isDone = false
			}
		}
		if isDone {
			hasMissionDone = true
			err = UpdateMissionCompleteState(tx, mission.ID, COMPLETED)
			if err != nil {
				return false, err
			}
		} else {
			allDone = false
		}
	}

	if allDone {
		err = AllocateMissionForPlayerByBatchID(tx, forPlayerId, maxBatchID+1)
		if err != nil {
			return false, err
		}
	}

	// check daily mission
	err = RefreshPlayerDailyMission(tx, forPlayerId)
	if err != nil {
		return false, err
	}

	dailyMissions, err := getPlayerDailyMission(tx, forPlayerId)
	if err != nil {
		return false, err
	}
	now := utils.UnixtimeMilli()

	for _, mission := range dailyMissions {
		if mission.CompleteState != NOT_COMPLETED {
			continue
		}
		if !CheckIsToday(now, mission.CreatedAt) {
			continue
		}
		isDone := true
		for _, quest := range mission.QuestList {
			if quest.CompletedCount == quest.CompletedCountRequired {
				continue
			}
			isQuestDone, err := checkIsQuestCompleted(
				tx,
				quest,
				preSyncData,
				syncData,
				preBuildableBindingMap,
				buildableBindingMap,
				prePlayerRecipeMap,
				playerRecipeMap,
				prePlayerIdleGameIngredientMap,
				playerIdleGameIngredientMap,
			)
			if err != nil {
				return false, err
			}
			if !isQuestDone {
				isDone = false
			}
		}
		if isDone {
			hasMissionDone = true
			err = UpdateMissionCompleteState(tx, mission.ID, COMPLETED)
			if err != nil {
				return false, err
			}
		}
	}

	err = processAchievement(tx,
		forPlayerId,
		preSyncData,
		syncData,
		prePlayerRecipeList,
		playerRecipeList,
		prePlayerIdleGameIngredientMap,
		playerIdleGameIngredientMap)
	if err != nil {
		return false, err
	}

	return hasMissionDone, nil
}

/**
compare quest related info and update player quest binding
*/
func checkIsQuestCompleted(
	tx *sqlx.Tx,
	quest *PlayerQuestBinding,
	preSyncData *pb.SyncDataStruct,
	syncData *pb.SyncDataStruct,
	preBuildableBindingMap map[int32][]*pb.PlayerBuildableBinding,
	buildableBindingMap map[int32][]*pb.PlayerBuildableBinding,
	prePlayerRecipeMap map[int32]*PlayerRecipe,
	playerRecipeMap map[int32]*PlayerRecipe,
	prePlayerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) (bool, error) {
	var hasQuestDone = false

	if quest.ResourceType == GOLD && preSyncData != nil && syncData != nil {
		wallet := syncData.GetWallet()
		preWallet := preSyncData.GetWallet()
		if wallet.GetGold() >= quest.ResourceTargetQuantity &&
			preWallet.GetGold() < quest.ResourceTargetQuantity {
			hasQuestDone = true
			err := increasePlayerQuestBindingCompleteCount(tx, quest.ID, 1)
			if err != nil {
				return hasQuestDone, err
			}
		}
	} else if quest.ResourceType == STATEFUL_BUILDABLE_LEVEL && buildableBindingMap != nil {
		var completedCount int32 = 0
		var preCompletedCount int32 = 0

		if len(preBuildableBindingMap) > 0 {
			preBindingList, ok := preBuildableBindingMap[quest.ResourceTargetId]
			if ok {
				for _, binding := range preBindingList {
					if binding.GetCurrentLevel() >= quest.ResourceTargetQuantity {
						preCompletedCount++
					}
				}
			}
		}

		bindingList, ok := buildableBindingMap[quest.ResourceTargetId]
		if ok {
			for _, binding := range bindingList {
				if binding.GetCurrentLevel() >= quest.ResourceTargetQuantity {
					completedCount++
				}
			}
		}
		hasQuestDone = (quest.CompletedCount + completedCount - preCompletedCount) >= quest.CompletedCountRequired
		err := increasePlayerQuestBindingCompleteCount(tx, quest.ID, completedCount-preCompletedCount)
		if err != nil {
			return hasQuestDone, err
		}
	} else if quest.ResourceType == RECIPE_UNLOCK &&
		prePlayerRecipeMap != nil && playerRecipeMap != nil {
		prePlayerRecipe := prePlayerRecipeMap[quest.ResourceTargetId]
		playerRecipe := playerRecipeMap[quest.ResourceTargetId]
		if playerRecipe == nil {
			return false, nil
		}

		if (prePlayerRecipe == nil || prePlayerRecipe.State != PLAYER_RECIPE_UNLOCKED) && playerRecipe.State == PLAYER_RECIPE_UNLOCKED {
			hasQuestDone = true
			err := increasePlayerQuestBindingCompleteCount(tx, quest.ID, 1)
			if err != nil {
				return hasQuestDone, err
			}
		}
	} else if quest.ResourceType == INGREDIENT_UNLOCK &&
		prePlayerIdleGameIngredientMap != nil && playerIdleGameIngredientMap != nil {
		prePlayerIngredient := prePlayerIdleGameIngredientMap[quest.ResourceTargetId]
		playerIngredient := playerIdleGameIngredientMap[quest.ResourceTargetId]
		if playerIngredient == nil {
			return false, nil
		}

		if (prePlayerIngredient == nil || prePlayerIngredient.State != PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED) && playerIngredient.State == PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED {
			hasQuestDone = true
			err := increasePlayerQuestBindingCompleteCount(tx, quest.ID, 1)
			if err != nil {
				return hasQuestDone, err
			}
		}
	} else if (quest.ResourceType == DISH_SOLD ||
		quest.ResourceType == SERVED_CUSTOMER ||
		quest.ResourceType == INGREDIENT_PRODUCE ||
		quest.ResourceType == FREE_ORDER_INCOME) && syncData != nil {
		questCompleted, ok := syncData.GetQuestCompletedMap()[quest.ID]
		if ok {
			hasQuestDone = questCompleted >= quest.CompletedCountRequired
			err := increasePlayerQuestBindingCompleteCount(tx, quest.ID, questCompleted-quest.CompletedCount)
			if err != nil {
				return hasQuestDone, err
			}
		}
	}

	return hasQuestDone, nil
}

func RefreshPlayerDailyMission(tx *sqlx.Tx, playerID int32) error {
	dailyMissions, err := getPlayerDailyMission(tx, playerID)
	now := utils.UnixtimeMilli()

	if err != nil {
		return err
	}

	toDelQuestBindingId := make([]int32, 0)
	toDelMissionBindingId := make([]int32, 0)
	hasTodayMission := false

	for _, mission := range dailyMissions {
		if CheckIsToday(now, mission.CreatedAt) {
			hasTodayMission = true
			continue
		}

		toDelMissionBindingId = append(toDelMissionBindingId, mission.ID)
		for _, quest := range mission.QuestList {
			toDelQuestBindingId = append(toDelQuestBindingId, quest.ID)
		}
	}

	if len(toDelQuestBindingId) > 0 {
		deleteSql := fmt.Sprintf("DELETE FROM %s WHERE id IN (?)", TBL_PLAYER_QUEST_BINDING)
		query, args, err := sqlx.In(deleteSql, toDelQuestBindingId)
		if err != nil {
			return err
		}
		_, err = tx.Exec(query, args...)
		if err != nil {
			return err
		}
	}

	if len(toDelMissionBindingId) > 0 {
		deleteSql := fmt.Sprintf("DELETE FROM %s WHERE id IN (?)", TBL_PLAYER_MISSION_BINDING)
		query, args, err := sqlx.In(deleteSql, toDelMissionBindingId)
		if err != nil {
			return err
		}
		_, err = tx.Exec(query, args...)
		if err != nil {
			return err
		}
	}

	if !hasTodayMission {
		err = addDailyMissionToPlayer(tx, playerID)
		if err != nil {
			return err
		}
	}

	return nil
}

func increasePlayerQuestBindingCompleteCount(tx *sqlx.Tx, bindingID int32, increasedCompletedCount int32) error {
	now := utils.UnixtimeMilli()
	incrementSql := fmt.Sprintf("UPDATE %s SET updated_at=?, completed_count= CASE WHEN completed_count+ ? >= completed_count_required THEN completed_count_required ELSE completed_count+? END WHERE id=?", TBL_PLAYER_QUEST_BINDING)
	query, err := tx.Preparex(incrementSql)
	if nil != err {
		return err
	}
	_, err = query.Exec(now, increasedCompletedCount, increasedCompletedCount, bindingID)
	if err != nil {
		return err
	}
	return nil
}

func composeBuildableBindingMap(syncData *pb.SyncDataStruct) map[int32][]*pb.PlayerBuildableBinding {
	if syncData == nil {
		return nil
	}
	resMap := make(map[int32][]*pb.PlayerBuildableBinding)

	for _, binding := range syncData.PlayerBuildableBindingList {
		_, ok := resMap[binding.Buildable.Id]
		if !ok {
			resMap[binding.Buildable.Id] = make([]*pb.PlayerBuildableBinding, 0)
		}
		resMap[binding.Buildable.Id] = append(resMap[binding.Buildable.Id], binding)
	}
	return resMap
}

func composePlayerRecipeMap(playerRecipeList []*PlayerRecipe) map[int32]*PlayerRecipe {
	if len(playerRecipeList) == 0 {
		return nil
	}
	resMap := make(map[int32]*PlayerRecipe)

	for _, playerRecipe := range playerRecipeList {
		if playerRecipe.RecipeID == nil || !playerRecipe.RecipeID.Valid {
			continue
		}
		resMap[int32(playerRecipe.RecipeID.Int64)] = playerRecipe
	}
	return resMap
}

func getPlayerDailyMission(tx *sqlx.Tx, playerID int32) ([]*PlayerMissionBinding, error) {
	query, args, err := sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.Eq{"player_id": playerID, "reproductive": DAILY_MISSION, "type": MISSION_TYPE_DEFAULT}).
		OrderBy("id asc").
		ToSql()
	var dailyMissions []*PlayerMissionBinding

	err = tx.Select(&dailyMissions, query, args...)
	if err != nil {
		return nil, err
	}
	err = getQuests(tx, dailyMissions, playerID)
	if err != nil {
		return nil, err
	}

	return dailyMissions, nil
}

func addDailyMissionToPlayer(tx *sqlx.Tx, playerID int32) error {
	dailyMissions, err := GetDailyMission(tx)
	if err != nil || len(dailyMissions) == 0 {
		return err
	}

	err = addMissionsToPlayer(tx, dailyMissions, playerID)
	if err != nil {
		return err
	}

	return nil
}

func processAchievement(tx *sqlx.Tx,
	forPlayerId int32,
	preSyncData *pb.SyncDataStruct,
	syncData *pb.SyncDataStruct,
	prePlayerRecipeList []*PlayerRecipe,
	playerRecipeList []*PlayerRecipe,
	prePlayerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
	playerIdleGameIngredientMap map[int32]*PlayerIngredientForIdleGame,
) error {
	query, args, err := sq.Select("*").
		From(TBL_PLAYER_MISSION_BINDING).
		Where(sq.Eq{"player_id": forPlayerId, "type": MISSION_TYPE_ACHIEVEMENT, "complete_state": NOT_COMPLETED}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return err
	}

	var missions []*PlayerMissionBinding

	err = tx.Select(&missions, query, args...)
	if err != nil {
		return err
	}
	err = getQuests(tx, missions, forPlayerId)
	if err != nil {
		return err
	}

	buildableBindingMap := composeBuildableBindingMap(syncData)
	preBuildableBindingMap := composeBuildableBindingMap(preSyncData)
	playerRecipeMap := composePlayerRecipeMap(playerRecipeList)
	prePlayerRecipeMap := composePlayerRecipeMap(prePlayerRecipeList)

	for _, mission := range missions {
		if mission.CompleteState != NOT_COMPLETED {
			continue
		}
		isDone := true
		for _, quest := range mission.QuestList {
			if quest.CompletedCount == quest.CompletedCountRequired {
				continue
			}
			isQuestDone, err := checkIsQuestCompleted(
				tx,
				quest,
				preSyncData,
				syncData,
				preBuildableBindingMap,
				buildableBindingMap,
				prePlayerRecipeMap,
				playerRecipeMap,
				prePlayerIdleGameIngredientMap,
				playerIdleGameIngredientMap,
			)
			if err != nil {
				return err
			}
			if !isQuestDone {
				isDone = false
			}
		}
		if isDone {
			err = UpdateMissionCompleteState(tx, mission.ID, COMPLETED)
			if err != nil {
				return err
			}

			err = AllocateAchievementForPlayerByBatchID(
				tx,
				forPlayerId,
				mission.MissionID,
				syncData,
				buildableBindingMap,
				playerRecipeMap,
				playerIdleGameIngredientMap,
			)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func CheckUserAchievementExistAndAllocate(tx *sqlx.Tx, playerID int32) error {
	count, err := txGetCount(tx, TBL_PLAYER_MISSION_BINDING, sq.Eq{"player_id": playerID, "type": MISSION_TYPE_ACHIEVEMENT})
	if err != nil {
		return err
	}
	if count == 0 {
		err = AllocateAchievementForPlayerByBatchID(tx, playerID, 0, nil, nil, nil, nil)
		if err != nil {
			return err
		}
	}
	return nil
}
