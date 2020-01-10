package models

import (
	"database/sql"
	"fmt"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	"math"
	. "server/common"
	utils "server/common/utils"
)

const (
	INGREDIENT_PROGRESS_MAX_PER_PLAYER                   = 100
	INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING = 15

	INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED = 0
	INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED                   = 1

	INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED = 2
	INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED                   = 3
	INGREDIENT_PROGRESS_STATE_COMPLETED_TO_BE_MANUALLY_COLLECTED                   = 4

	INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED = 5
	INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED               = 6
	INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED                = 7

	INGREDIENT_PROGRESS_TYPE_PRODUCE    = 1
	INGREDIENT_PROGRESS_TYPE_SYNTHESIZE = 2
	INGREDIENT_PROGRESS_TYPE_RECLAIM    = 3
)

type IngredientProgress struct {
	Id                       int32      `json:"id" db:"id"`
	OwnerPlayerId            int32      `json:"-" db:"owner_player_id"`
	IngredientId             *int32     `json:"ingredientId" db:"ingredient_id"`
	PtrState                 *int32     `json:"state" db:"state"`
	PlayerBuildableBindingId *NullInt64 `json:"playerBuildableBindingId" db:"player_buildable_binding_id"`
	RecipeId                 *NullInt64 `json:"recipeId" db:"recipe_id"`
	CreatedAt                int64      `json:"createdAt" db:"created_at"`
	DurationMillis           int32      `json:"durationMillis" db:"duration_millis"`
	StartedAt                *NullInt64 `json:"startedAt" db:"started_at"`
	MillisToStart            *NullInt64 `json:"millisToStart" db:"millis_to_start"`
	UpdatedAt                *NullInt64 `json:"updatedAt" db:"updated_at"`
	TargetIngredientCount    *int32     `json:"targetIngredientCount" db:"target_ingredient_count"`
	ProgressType             int32      `json:"progressType" db:"progress_type"`
}

func InsertIngredientProgressFromRecipe(tx *sqlx.Tx, forPlayerId int32, recipe *Recipe, pForPlayerBuildableBindingId *int32, millisToStartForImmediateInsertion int32, pAutoCollect *int32) (*int64, error) {
	var pInitialState *int
	pInitialState = nil
	if 0 == *pAutoCollect {
		initialState := INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED
		pInitialState = (&initialState)
	} else {
		initialState := INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED
		pInitialState = (&initialState)
	}

	if nil == pInitialState {
		panic("Nil `pInitialState`!")
	}

	if nil == pForPlayerBuildableBindingId {
		panic("Nil `pForPlayerBuildableBindingId`!")
	}
	var result sql.Result
	var err error
	nowMillis := utils.UnixtimeMilli()
	result, err = txInsert(tx, TBL_INGREDIENT_PROGRESS, []string{"owner_player_id", "recipe_id",
		"ingredient_id", "player_buildable_binding_id", "created_at", "updated_at", "duration_millis", "millis_to_start", "state", "target_ingredient_count", "progress_type"},
		[]interface{}{
			forPlayerId,
			recipe.Id,
			recipe.TargetIngredientId,
			(*pForPlayerBuildableBindingId),
			nowMillis, nowMillis,
			recipe.DurationMillis,
			millisToStartForImmediateInsertion,
			*pInitialState,
			recipe.TargetIngredientCount, INGREDIENT_PROGRESS_TYPE_SYNTHESIZE})
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return (&id), err
}

func InsertIngredientProgressFromPlayerBuildableBinding(tx *sqlx.Tx, forPlayerId int32, forIngredientId int32, pForPlayerBuildableBindingId *int32, durationMillis int32, millisToStartForImmediateInsertion int32, pAutoCollect *int32) (*int64, error) {
	var pInitialState *int
	pInitialState = nil
	if 0 == *pAutoCollect {
		initialState := INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED
		pInitialState = (&initialState)
	} else {
		initialState := INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED
		pInitialState = (&initialState)
	}

	if nil == pInitialState {
		panic("Nil `pInitialState`!")
	}
	if nil == pForPlayerBuildableBindingId {
		panic("Nil `pForPlayerBuildableBindingId`!")
	}
	nowMillis := utils.UnixtimeMilli()
	result, err := txInsert(tx, TBL_INGREDIENT_PROGRESS, []string{"owner_player_id",
		"ingredient_id", "player_buildable_binding_id", "created_at", "updated_at", "duration_millis", "millis_to_start", "state", "progress_type"},
		[]interface{}{forPlayerId, forIngredientId, *pForPlayerBuildableBindingId,
			nowMillis, nowMillis, durationMillis, millisToStartForImmediateInsertion,
			*pInitialState, INGREDIENT_PROGRESS_TYPE_PRODUCE})
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return (&id), err
}

func InsertIngredientProgressToReclaim(tx *sqlx.Tx, forPlayerId int32, forIngredientId int32, pForPlayerBuildableBindingId *int32, durationMillis int32, millisToStartForImmediateInsertion int32) (*int64, error) {
	var pInitialState *int
	pInitialState = nil
	initialState := INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED
	pInitialState = (&initialState)

	if nil == pInitialState {
		panic("Nil `pInitialState`!")
	}
	if nil == pForPlayerBuildableBindingId {
		panic("Nil `pForPlayerBuildableBindingId`!")
	}
	nowMillis := utils.UnixtimeMilli()
	result, err := txInsert(tx, TBL_INGREDIENT_PROGRESS, []string{"owner_player_id",
		"ingredient_id", "player_buildable_binding_id", "created_at", "updated_at", "duration_millis", "millis_to_start", "state", "progress_type"},
		[]interface{}{forPlayerId, forIngredientId, *pForPlayerBuildableBindingId,
			nowMillis, nowMillis, durationMillis, millisToStartForImmediateInsertion,
			*pInitialState, INGREDIENT_PROGRESS_TYPE_RECLAIM})
	if err != nil {
		return nil, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	return (&id), err
}

func QueryOneIngredientProgress(tx *sqlx.Tx, forPlayerId int32, forIngredientProgressId int32, forUpdate bool) (*IngredientProgress, error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	if false == forUpdate {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? AND owner_player_id=? LIMIT 1", TBL_INGREDIENT_PROGRESS)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? AND owner_player_id=? LIMIT 1 FOR UPDATE ", TBL_INGREDIENT_PROGRESS)
	}

	query, args, err = sqlx.In(queryBaseStr, forIngredientProgressId, forPlayerId)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredientProgress`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredientProgress`#2", zap.Error(err))
		return nil, err
	}

	resultList := make([]*IngredientProgress, 0)
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredientProgress`#3", zap.Error(err))
		return nil, err
	}

	if 0 >= len(resultList) {
		Logger.Error("Error occurred during invocation of `QueryOneIngredientProgress`#4", zap.Error(err))
		return nil, err
	}

	return resultList[0], nil
}

func CollectAppropriateIngredients(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32) (ingredientProgressList []*IngredientProgress, retErr error) {
	/*
	 * [WARNING]
	 *
	 * The invocation of this method should be ALWAYS preceded with an invocation of "checkIngredientCompletionAndUpdateStateIfApplicable".
	 *
	 * --YFLu
	 */
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state=? AND player_buildable_binding_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
	query, args, err = sqlx.In(queryBaseStr, forPlayerId, INGREDIENT_PROGRESS_STATE_COMPLETED_TO_BE_MANUALLY_COLLECTED, *pForPlayerBuildableBindingId)

	if err != nil {
		Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`#2", zap.Error(err))
		return nil, err
	}

	toUpsertList := []*IngredientProgress{}
	err = tx.Select(&toUpsertList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`#3", zap.Error(err))
		return nil, err
	}

	/*
	 * Putting completed "ingredient_progress" records into "knapsack".
	 */
	Logger.Info("\tCollectAppropriateIngredients", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toUpsertList", toUpsertList))

	for _, completedIngredientProgress := range toUpsertList {
		//rowsAffected, localErr := UpsertKnapsackRecord(tx, *completedIngredientProgress.IngredientId, increCount, completedIngredientProgress.OwnerPlayerId)
		var recipeId *int32
		if completedIngredientProgress.RecipeId == nil {
			recipeId = nil
		} else {
			recipeId = new(int32)
			*recipeId = int32(completedIngredientProgress.RecipeId.Int64)
		}
		rowsAffected, localErr := UpsertKnapsackRecordByRecipeTarget(
			tx,
			recipeId,
			completedIngredientProgress.IngredientId,
			completedIngredientProgress.TargetIngredientCount,
			completedIngredientProgress.OwnerPlayerId)
		if localErr != nil {
			Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`", zap.Error(localErr))
			return nil, localErr
		}
		Logger.Info("\tCollectAppropriateIngredients, inserted a `knapsack` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsAffected", rowsAffected))
		if 0 < rowsAffected {
			deleteBaseStr := fmt.Sprintf("DELETE FROM %s WHERE id=?", TBL_INGREDIENT_PROGRESS)
			deleteQ, localDelErr := tx.Preparex(deleteBaseStr)
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`", zap.Error(localDelErr))
				return nil, localDelErr
			}
			deletedResult := deleteQ.MustExec(completedIngredientProgress.Id)
			rowsDeleted, localDelErr := deletedResult.RowsAffected()
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `CollectAppropriateIngredients`", zap.Error(localDelErr))
				return nil, localDelErr
			}
			Logger.Info("\tCollectAppropriateIngredients, deleted an `ingredient_progress` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsDeleted", rowsDeleted))
			if completedIngredientProgress.RecipeId != nil {
				_, err = UnlockPlayerRecipe(tx, forPlayerId, int32(completedIngredientProgress.RecipeId.Int64))
				if err != nil {
					Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#6", zap.Error(err))
					return nil, err
				}
			}
			if 0 < rowsDeleted {
			}
		}
	}

	ingredientProgressList, err = QueryIngredientProgressListByPlayerBuildableBindingId(tx, forPlayerId, *pForPlayerBuildableBindingId)
	return ingredientProgressList, err
}

func CheckIngredientCompletionOfPlayer(tx *sqlx.Tx, forPlayerId int32) (ingredientProgressList []*IngredientProgress, retErr error) {
	/**
	 * TODO
	 *
	 * Optimize time-complexity.
	 *
	 * -- YFLu
	 */
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
	query, args, err = sqlx.In(queryBaseStr, forPlayerId)

	if err != nil {
		Logger.Error("Error occurred during invocation of `CheckIngredientCompletionOfPlayer`", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `CheckIngredientCompletionOfPlayer`", zap.Error(err))
		return nil, err
	}

	var toInspectList []*IngredientProgress
	err = tx.Select(&toInspectList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `CheckIngredientCompletionOfPlayer`", zap.Error(err))
		return nil, err
	}

	playerBuildableBindingIdToAutoCollectFlagDict := map[int32]int32{}
	for _, v := range toInspectList {
		convertedPlayerBuildableBindingId := int32((*v.PlayerBuildableBindingId).Int64)
		if _, ok := playerBuildableBindingIdToAutoCollectFlagDict[convertedPlayerBuildableBindingId]; ok {
			continue
		}

		state := *v.PtrState
		switch state {
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
			playerBuildableBindingIdToAutoCollectFlagDict[convertedPlayerBuildableBindingId] = int32(1)
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_COMPLETED_TO_BE_MANUALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED:
			playerBuildableBindingIdToAutoCollectFlagDict[convertedPlayerBuildableBindingId] = int32(0)
		default:
			panic(fmt.Sprintf("Invalid ingredient_progress.state found %v", v))
		}
	}

	var resultedIngredientProgressList []*IngredientProgress

	for playerBuildableBindingId, autoCollect := range playerBuildableBindingIdToAutoCollectFlagDict {
		ingredientProgressList, _, _, _, err := CheckIngredientCompletion(tx, forPlayerId, (&playerBuildableBindingId), (&autoCollect))
		if err != nil {
			Logger.Error("Error occurred during invocation of `CheckIngredientCompletionOfPlayer`", zap.Error(err))
			return nil, err
		}
		resultedIngredientProgressList = append(resultedIngredientProgressList, ingredientProgressList...)
	}
	return resultedIngredientProgressList, nil
}

func CheckIngredientCompletion(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32, pAutoCollect *int32) (
	ingredientProgressList []*IngredientProgress,
	pMillisToStartForProduceImmediateInsertion *int32,
	pMillisToStartForSynthesizeImmediateInsertion *int32,
	pMillisToStartForReclaimImmediateInsertion *int32,
	retErr error) {
	if 1 == *pAutoCollect {
		return checkIngredientCompletionAndMoveToKnapsackIfApplicable(tx, forPlayerId, pForPlayerBuildableBindingId)
	} else {
		return checkIngredientCompletionAndUpdateStateIfApplicable(tx, forPlayerId, pForPlayerBuildableBindingId)
	}
}

func checkIngredientCompletionAndUpdateStateIfApplicable(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32) (
	ingredientProgressList []*IngredientProgress,
	pMillisToStartForImmediateInsertion *int32,
	pMillisToStartForSynthesizeImmediateInsertion *int32,
	pMillisToStartForReclaimImmediateInsertion *int32,
	retErr error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	nowMillis := utils.UnixtimeMilli()
	if nil == pForPlayerBuildableBindingId {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?,?,?) ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED,
		)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?,?,?) AND player_buildable_binding_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED,
			*pForPlayerBuildableBindingId,
		)
	}
	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#0", zap.Any("query", query), zap.Any("args", args))

	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#1", zap.Error(err))
		return nil, nil, nil, nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#2", zap.Error(err))
		return nil, nil, nil, nil, err
	}

	var toInspectList []*IngredientProgress
	err = tx.Select(&toInspectList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#3", zap.Error(err))
		return nil, nil, nil, nil, err
	}

	var incompleteList []*IngredientProgress
	var completedList []*IngredientProgress

	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#1", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toInspectList", toInspectList))

	for _, ingredientProgress := range toInspectList {
		if nil == ingredientProgress.StartedAt {
			// Handling a "ingredientProgress" which is NOT being actively produced, yet still possesses a chance to be already completed.
			if nowMillis >= ingredientProgress.UpdatedAt.Int64+ingredientProgress.MillisToStart.Int64+int64(ingredientProgress.DurationMillis) {
				completedList = append(completedList, ingredientProgress)
			} else {
				incompleteList = append(incompleteList, ingredientProgress)
			}
		} else {
			// Handling the "ingredientProgress" which is being actively produced.
			if nowMillis >= ingredientProgress.StartedAt.Int64+int64(ingredientProgress.DurationMillis) {
				completedList = append(completedList, ingredientProgress)
			} else {
				incompleteList = append(incompleteList, ingredientProgress)
			}
		}
	}

	/*
	 * Update `state` of completed "ingredient_progress" records.
	 */
	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#2", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedList", completedList))

	for _, completedIngredientProgress := range completedList {
		updateQBaseStr := fmt.Sprintf("UPDATE %s SET state=?,updated_at=?,millis_to_start=NULL,started_at=NULL WHERE id=?", TBL_INGREDIENT_PROGRESS)
		updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
		if localUpdateErr != nil {
			Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#4", zap.Error(localUpdateErr))
			return nil, nil, nil, nil, localUpdateErr
		}
		var toUpdateState int32
		switch *(completedIngredientProgress.PtrState) {
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED:
			toUpdateState = INGREDIENT_PROGRESS_STATE_COMPLETED_TO_BE_MANUALLY_COLLECTED
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED:
			toUpdateState = INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED
		default:
			panic("Unexpected *(completedIngredientProgress.PtrState)!")
			break
		}
		updateResult := updateQ.MustExec(toUpdateState, nowMillis, completedIngredientProgress.Id)
		rowsUpdated, localUpdateErr := updateResult.RowsAffected()
		if localUpdateErr != nil {
			Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#5", zap.Error(localUpdateErr))
			return nil, nil, nil, nil, localUpdateErr
		}
		if 0 < rowsUpdated {
			// TODO
		}
	}

	/*
	 * Update the queue regarding
	 * - setting a new `being actively produced` "ingredient_progress", and
	 * - each "ingredient_progress.millis_to_start".
	 */
	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#5", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("incompleteList", incompleteList))

	millisToStartForProduceImmediateInsertion := int32(0)
	millisToStartForSynthesizeImmediateInsertion := int32(0)
	nonNullStartedAtExistsWithinIncompleteList := false
	toggledNewStartedAt := false
	for _, incompleteIngredientProgress := range incompleteList {
		if nil != incompleteIngredientProgress.StartedAt {
			nonNullStartedAtExistsWithinIncompleteList = true
			break
		}
	}
	for _, incompleteIngredientProgress := range incompleteList {
		var mightHaveBeenStartedAt int64
		if nil != incompleteIngredientProgress.StartedAt {
			mightHaveBeenStartedAt = incompleteIngredientProgress.StartedAt.Int64
		} else {
			if false == nonNullStartedAtExistsWithinIncompleteList && false == toggledNewStartedAt {
				mightHaveBeenStartedAt = nowMillis
				toggledNewStartedAt = true
			} else {
				mightHaveBeenStartedAt = (incompleteIngredientProgress.UpdatedAt.Int64 + incompleteIngredientProgress.MillisToStart.Int64)
			}
		}
		elapsedMillis := (nowMillis - incompleteIngredientProgress.UpdatedAt.Int64)
		if nowMillis >= mightHaveBeenStartedAt {
			// Make it the `being actively produced` "ingredient_progress".
			updateQBaseStr := fmt.Sprintf("UPDATE %s SET state=?,updated_at=?,started_at=?,millis_to_start=NULL WHERE id=?", TBL_INGREDIENT_PROGRESS)
			updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#6", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			var toUpdateState int32
			switch *(incompleteIngredientProgress.PtrState) {
			case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
				INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED:
				toUpdateState = INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED
			case INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
				INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED:
				toUpdateState = INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED
			default:
				panic("Unexpected *(incompleteIngredientProgress.PtrState)!")
				break
			}
			updateResult := updateQ.MustExec(toUpdateState, nowMillis, mightHaveBeenStartedAt, incompleteIngredientProgress.Id)
			rowsUpdated, localUpdateErr := updateResult.RowsAffected()
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#7", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			if 0 < rowsUpdated {
				// TODO
			}
			if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_PRODUCE {
				millisToStartForProduceImmediateInsertion += incompleteIngredientProgress.DurationMillis - int32(nowMillis-mightHaveBeenStartedAt)
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_SYNTHESIZE {
				millisToStartForSynthesizeImmediateInsertion += incompleteIngredientProgress.DurationMillis - int32(nowMillis-mightHaveBeenStartedAt)
			}
		} else {
			updateQBaseStr := fmt.Sprintf("UPDATE %s SET updated_at=?,millis_to_start=millis_to_start-? WHERE id=?", TBL_INGREDIENT_PROGRESS)
			updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#8", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			updateResult := updateQ.MustExec(nowMillis, elapsedMillis, incompleteIngredientProgress.Id)
			rowsUpdated, localUpdateErr := updateResult.RowsAffected()
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#9", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			if 0 < rowsUpdated {
				// TODO
			}
			if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_PRODUCE {
				millisToStartForProduceImmediateInsertion += incompleteIngredientProgress.DurationMillis
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_SYNTHESIZE {
				millisToStartForSynthesizeImmediateInsertion += incompleteIngredientProgress.DurationMillis
			}
		}
	}

	ingredientProgressList, err = QueryIngredientProgressListByPlayerBuildableBindingId(tx, forPlayerId, *pForPlayerBuildableBindingId)
	if nil != err {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndUpdateStateIfApplicable`#11", zap.Error(err))
		return nil, nil, nil, nil, err
	}
	return ingredientProgressList, (&millisToStartForProduceImmediateInsertion), (&millisToStartForSynthesizeImmediateInsertion), nil, nil
}

func checkIngredientCompletionAndMoveToKnapsackIfApplicable(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32) (
	ingredientProgressList []*IngredientProgress,
	pMillisToStartForImmediateInsertion *int32,
	pMillisToStartForSynthesizeImmediateInsertion *int32,
	pMillisToStartForReclaimImmediateInsertion *int32,
	retErr error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	nowMillis := utils.UnixtimeMilli()
	if nil == pForPlayerBuildableBindingId {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?) ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId, INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?) AND player_buildable_binding_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId, INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED, *pForPlayerBuildableBindingId)
	}

	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#1", zap.Error(err))
		return nil, nil, nil, nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#2", zap.Error(err))
		return nil, nil, nil, nil, err
	}

	toInspectList := []*IngredientProgress{}
	err = tx.Select(&toInspectList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#3", zap.Error(err))
		return nil, nil, nil, nil, err
	}

	toUpdateList := []*IngredientProgress{}
	toUpsertList := []*IngredientProgress{}

	// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#1", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toInspectList", toInspectList))

	for _, ingredientProgress := range toInspectList {
		if nil == ingredientProgress.StartedAt {
			// Handling a "ingredientProgress" which is NOT being actively produced, yet still possesses a chance to be already completed.
			if nowMillis >= ingredientProgress.UpdatedAt.Int64+ingredientProgress.MillisToStart.Int64+int64(ingredientProgress.DurationMillis) {
				toUpsertList = append(toUpsertList, ingredientProgress)
			} else {
				toUpdateList = append(toUpdateList, ingredientProgress)
			}
		} else {
			// Handling the "ingredientProgress" which is being actively produced.
			if nowMillis >= ingredientProgress.StartedAt.Int64+int64(ingredientProgress.DurationMillis) {
				toUpsertList = append(toUpsertList, ingredientProgress)
			} else {
				toUpdateList = append(toUpdateList, ingredientProgress)
			}
		}
	}

	/*
	 * Putting completed "ingredient_progress" records into "knapsack".
	 */
	// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#2", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toUpsertList", toUpsertList))

	for _, completedIngredientProgress := range toUpsertList {
		//rowsAffected, localErr := UpsertKnapsackRecord(tx, *completedIngredientProgress.IngredientId, increCount, completedIngredientProgress.OwnerPlayerId)
		Logger.Info("complete recipe", zap.Any("progress", completedIngredientProgress))
		var recipeId *int32
		if completedIngredientProgress.RecipeId == nil {
			recipeId = nil
		} else {
			recipeId = new(int32)
			*recipeId = int32(completedIngredientProgress.RecipeId.Int64)
		}
		rowsAffected, localErr := UpsertKnapsackRecordByRecipeTarget(
			tx,
			recipeId,
			completedIngredientProgress.IngredientId,
			completedIngredientProgress.TargetIngredientCount,
			completedIngredientProgress.OwnerPlayerId)
		if localErr != nil {
			Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#4", zap.Error(localErr))
			return nil, nil, nil, nil, localErr
		}
		// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#3, inserted a `knapsack` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsAffected", rowsAffected))
		if 0 < rowsAffected {
			deleteBaseStr := fmt.Sprintf("DELETE FROM %s WHERE id=?", TBL_INGREDIENT_PROGRESS)
			deleteQ, localDelErr := tx.Preparex(deleteBaseStr)
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#5", zap.Error(localDelErr))
				return nil, nil, nil, nil, localDelErr
			}
			deletedResult := deleteQ.MustExec(completedIngredientProgress.Id)
			rowsDeleted, localDelErr := deletedResult.RowsAffected()
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#6", zap.Error(localDelErr))
				return nil, nil, nil, nil, localDelErr
			}
			// unlock related recipe
			if completedIngredientProgress.RecipeId != nil {
				_, err = UnlockPlayerRecipe(tx, forPlayerId, int32(completedIngredientProgress.RecipeId.Int64))
				if err != nil {
					Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#6", zap.Error(localDelErr))
					return nil, nil, nil, nil, err
				}
			}
			// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#4, deleted an `ingredient_progress` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsDeleted", rowsDeleted))
			if 0 < rowsDeleted {
			}
		}
	}

	/*
	 * Update the queue regarding
	 * - setting a new `being actively produced` "ingredient_progress", and
	 * - each "ingredient_progress.millis_to_start".
	 */
	// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#5", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toUpdateList", toUpdateList))

	millisToStartForProduceImmediateInsertion := int32(0)
	millisToStartForSynthesizeImmediateInsertion := int32(0)
	millisToStartForReclaimImmediateInsertion := int32(0)
	nonNullStartedAtExistsWithinIncompleteList := false
	toggledNewStartedAt := false
	for _, incompleteIngredientProgress := range toUpdateList {
		if nil != incompleteIngredientProgress.StartedAt {
			nonNullStartedAtExistsWithinIncompleteList = true
			break
		}
	}
	for _, incompleteIngredientProgress := range toUpdateList {
		var mightHaveBeenStartedAt int64
		if nil != incompleteIngredientProgress.StartedAt {
			mightHaveBeenStartedAt = incompleteIngredientProgress.StartedAt.Int64
		} else {
			if false == nonNullStartedAtExistsWithinIncompleteList && false == toggledNewStartedAt {
				mightHaveBeenStartedAt = nowMillis
				toggledNewStartedAt = true
			} else {
				mightHaveBeenStartedAt = (incompleteIngredientProgress.UpdatedAt.Int64 + incompleteIngredientProgress.MillisToStart.Int64)
			}
		}
		elapsedMillis := (nowMillis - incompleteIngredientProgress.UpdatedAt.Int64)
		if nowMillis >= mightHaveBeenStartedAt {
			// Make it the `being actively produced` "ingredient_progress".
			updateQBaseStr := fmt.Sprintf("UPDATE %s SET updated_at=?,started_at=?,millis_to_start=NULL,state=? WHERE id=?", TBL_INGREDIENT_PROGRESS)
			updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#7", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			updateResult := updateQ.MustExec(nowMillis, mightHaveBeenStartedAt, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED, incompleteIngredientProgress.Id)
			rowsUpdated, localUpdateErr := updateResult.RowsAffected()
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#8", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			if 0 < rowsUpdated {
				// TODO
			}
			if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_PRODUCE {
				millisToStartForProduceImmediateInsertion += incompleteIngredientProgress.DurationMillis - int32(nowMillis-mightHaveBeenStartedAt)
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_SYNTHESIZE {
				millisToStartForSynthesizeImmediateInsertion += incompleteIngredientProgress.DurationMillis - int32(nowMillis-mightHaveBeenStartedAt)
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_RECLAIM {
				millisToStartForReclaimImmediateInsertion += incompleteIngredientProgress.DurationMillis - int32(nowMillis-mightHaveBeenStartedAt)
			}
		} else {
			updateQBaseStr := fmt.Sprintf("UPDATE %s SET updated_at=?,millis_to_start=millis_to_start-? WHERE id=?", TBL_INGREDIENT_PROGRESS)
			updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#9", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			updateResult := updateQ.MustExec(nowMillis, elapsedMillis, incompleteIngredientProgress.Id)
			rowsUpdated, localUpdateErr := updateResult.RowsAffected()
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#10", zap.Error(localUpdateErr))
				return nil, nil, nil, nil, localUpdateErr
			}
			if 0 < rowsUpdated {
				// TODO
			}
			if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_PRODUCE {
				millisToStartForProduceImmediateInsertion += incompleteIngredientProgress.DurationMillis
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_SYNTHESIZE {
				millisToStartForSynthesizeImmediateInsertion += incompleteIngredientProgress.DurationMillis
			} else if incompleteIngredientProgress.ProgressType == INGREDIENT_PROGRESS_TYPE_RECLAIM {
				millisToStartForReclaimImmediateInsertion += incompleteIngredientProgress.DurationMillis
			}
		}
	}

	ingredientProgressList, err = QueryIngredientProgressListByPlayerBuildableBindingId(tx, forPlayerId, *pForPlayerBuildableBindingId)
	if nil != err {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#11", zap.Error(err))
		return nil, nil, nil, nil, err
	}
	Logger.Info("",
		zap.Any("millisToStartForProduceImmediateInsertion", millisToStartForProduceImmediateInsertion),
		zap.Any("millisToStartForSynthesizeImmediateInsertion", millisToStartForSynthesizeImmediateInsertion),
		zap.Any("millisToStartForReclaimImmediateInsertion", millisToStartForReclaimImmediateInsertion),
	)
	return ingredientProgressList, (&millisToStartForProduceImmediateInsertion), &millisToStartForSynthesizeImmediateInsertion, &millisToStartForReclaimImmediateInsertion, nil
}

func QueryIngredientProgressListByPlayerId(tx *sqlx.Tx, ownerPlayerId int32) ([]*IngredientProgress, error) {
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=?", TBL_INGREDIENT_PROGRESS)
	query, args, err := sqlx.In(queryBaseStr, ownerPlayerId)

	if err != nil {
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		return nil, err
	}

	toRet := []*IngredientProgress{}
	err = tx.Select(&toRet, query, args...)
	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func QueryIngredientProgressListByPlayerBuildableBindingId(tx *sqlx.Tx, ownerPlayerId int32, playerBuildableBindingId int32) ([]*IngredientProgress, error) {
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND player_buildable_binding_id=?", TBL_INGREDIENT_PROGRESS)
	query, args, err := sqlx.In(queryBaseStr, ownerPlayerId, playerBuildableBindingId)

	if err != nil {
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		return nil, err
	}

	toRet := []*IngredientProgress{}
	err = tx.Select(&toRet, query, args...)
	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func DeleteIngredientProgress(tx *sqlx.Tx, playerId int32, ingredientProgress *IngredientProgress) (*int64, error) {
	/*
	 * - If "nil != ingredientProgress.RecipeId", compose an "insert on duplicate update statement" for the "Knapsack" table according to result of "models.GetRecipeRequireIngredientBindingList(...)". Moreover, we could have fields like "Recipe.GoldCost" in the future which should be taken into "refunding consideration" as well.
	 * - Delete the corresponding "ingredientProgress" physically & immediately from persistent storage engine, e.g. MySQLServer.
	 *
	 * -- YFLu
	 */
	switch *ingredientProgress.PtrState {
	case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED:
		if ingredientProgress.MillisToStart == nil || ingredientProgress.MillisToStart.Int64 < 1 {
			latestProgress, err := queryLatestNotRunningProgress(tx, playerId, ingredientProgress)
			if err != nil {
				Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#0", zap.Error(err))
				return nil, err
			}
			if latestProgress != nil && latestProgress.MillisToStart != nil && latestProgress.MillisToStart.Int64 > 0 {
				nowMillis := utils.UnixtimeMilli()
				updateQBaseStr := fmt.Sprintf("UPDATE %s SET updated_at=?,millis_to_start= CASE WHEN millis_to_start>=? THEN millis_to_start-? ELSE 0 WHERE owner_player_id=? AND player_buildable_binding_id=? AND progress_type=?", TBL_INGREDIENT_PROGRESS)
				updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
				if localUpdateErr != nil {
					Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#0-1", zap.Error(localUpdateErr))
					return nil, localUpdateErr
				}
				updateResult := updateQ.MustExec(nowMillis, latestProgress.MillisToStart.Int64, playerId, ingredientProgress.PlayerBuildableBindingId, ingredientProgress.ProgressType)
				_, localUpdateErr = updateResult.RowsAffected()
				if localUpdateErr != nil {
					Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#0-2", zap.Error(localUpdateErr))
					return nil, localUpdateErr
				}
			}
		} else {
			nowMillis := utils.UnixtimeMilli()
			updateQBaseStr := fmt.Sprintf("UPDATE %s SET updated_at=?,millis_to_start= CASE WHEN millis_to_start>=? THEN millis_to_start-? ELSE millis_to_start WHERE owner_player_id=? AND player_buildable_binding_id=? AND progress_type=?", TBL_INGREDIENT_PROGRESS)
			updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#0-1", zap.Error(localUpdateErr))
				return nil, localUpdateErr
			}
			updateResult := updateQ.MustExec(nowMillis, ingredientProgress.MillisToStart.Int64, playerId, ingredientProgress.PlayerBuildableBindingId, ingredientProgress.ProgressType)
			_, localUpdateErr = updateResult.RowsAffected()
			if localUpdateErr != nil {
				Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#0-2", zap.Error(localUpdateErr))
				return nil, localUpdateErr
			}
		}
	}
	deleteBaseStr := fmt.Sprintf("DELETE FROM %s WHERE id=? AND owner_player_id=? AND state IN (?,?,?,?,?,?)", TBL_INGREDIENT_PROGRESS)
	deleteQ, localDelErr := tx.Preparex(deleteBaseStr)
	if localDelErr != nil {
		Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#1", zap.Error(localDelErr))
		return nil, localDelErr
	}
	deletedResult := deleteQ.MustExec(
		ingredientProgress.Id,
		playerId,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED)
	rowsDeleted, localDelErr := deletedResult.RowsAffected()
	if localDelErr != nil {
		Logger.Error("Error occurred during invocation of `DeleteIngredientProgress`#2", zap.Error(localDelErr))
		return nil, localDelErr
	}
	return (&rowsDeleted), localDelErr
}

func queryLatestNotRunningProgress(tx *sqlx.Tx, playerId int32, ingredientProgress *IngredientProgress) (*IngredientProgress, error) {
	allProgress, err := QueryIngredientProgressListByPlayerBuildableBindingId(tx, playerId, int32(ingredientProgress.PlayerBuildableBindingId.Int64))
	if err != nil {
		Logger.Error("Error occurred during invocation of `queryLatestNotRunningProgress`#1", zap.Error(err))
		return nil, err
	}

	minProgressMillsToStart := int32(math.MaxInt32)
	var minProgress *IngredientProgress
	for _, progress := range allProgress {
		if progress.ProgressType == ingredientProgress.ProgressType {
			if progress.MillisToStart != nil && int32(progress.MillisToStart.Int64) < minProgressMillsToStart {
				minProgress = progress
				minProgressMillsToStart = int32(progress.MillisToStart.Int64)
			}
		}
	}

	if minProgressMillsToStart == math.MaxInt32 {
		return nil, nil
	}

	return minProgress, nil
}

func DeleteReclaimedIngredientProgressList(tx *sqlx.Tx, playerId int32, ingredientProgressIds []int32) ([]int32, error) {
	deletedIngredientProgressIds := make([]int32, 0)
	var err error
	if 0 < len(ingredientProgressIds) {
		var progresses []*IngredientProgress
		selectBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE id IN (?) FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err := sqlx.In(selectBaseStr, ingredientProgressIds)
		if err != nil {
			return nil, err
		}
		err = tx.Select(&progresses, query, args...)
		if err == sql.ErrNoRows {
			return nil, nil
		}

		for _, progress := range progresses {
			deletedIngredientProgressIds = append(deletedIngredientProgressIds, progress.Id)
		}

		if 0 < len(deletedIngredientProgressIds) {
			deleteBaseStr := fmt.Sprintf("DELETE FROM %s WHERE id IN (?) AND owner_player_id=? AND state=?", TBL_INGREDIENT_PROGRESS)
			deleteQ, args, err := sqlx.In(deleteBaseStr, deletedIngredientProgressIds, playerId, INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED)
			if err != nil {
				Logger.Error("Error occurred during invocation of `DeleteReclaimedIngredientProgressList`#1", zap.Error(err))
				return nil, err
			}

			_, err = tx.Exec(deleteQ, args...)
			if err != nil {
				Logger.Error("Error occurred during invocation of `DeleteReclaimedIngredientProgressList`#2", zap.Error(err))
				return nil, err
			}
		}
	}
	return deletedIngredientProgressIds, err
}

func BoostIngredientProgress(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32, pAutoCollect *int32) (ingredientProgressList []*IngredientProgress, retErr error) {
	if 1 == *pAutoCollect {
		return boostIngredientProgressAndMoveToKnapsackIfApplicable(tx, forPlayerId, pForPlayerBuildableBindingId)
	} else {
		return boostIngredientProgress(tx, forPlayerId, pForPlayerBuildableBindingId)
	}
}

func boostIngredientProgress(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32) (ingredientProgressList []*IngredientProgress, retErr error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	nowMillis := utils.UnixtimeMilli()
	if nil == pForPlayerBuildableBindingId {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?,?,?) ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED,
		)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?,?,?) AND player_buildable_binding_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED,
			*pForPlayerBuildableBindingId,
		)
	}
	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#0", zap.Any("query", query), zap.Any("args", args))

	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgress`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgress`#2", zap.Error(err))
		return nil, err
	}

	var toInspectList []*IngredientProgress
	err = tx.Select(&toInspectList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgress`#3", zap.Error(err))
		return nil, err
	}

	var completedList []*IngredientProgress

	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#1", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toInspectList", toInspectList))

	for _, ingredientProgress := range toInspectList {
		completedList = append(completedList, ingredientProgress)
	}

	/*
	 * Update `state` of completed "ingredient_progress" records.
	 */
	// Logger.Info("\tcheckIngredientCompletionAndUpdateStateIfApplicable#2", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedList", completedList))

	for _, completedIngredientProgress := range completedList {
		updateQBaseStr := fmt.Sprintf("UPDATE %s SET state=?,updated_at=?,millis_to_start=NULL,started_at=NULL WHERE id=?", TBL_INGREDIENT_PROGRESS)
		updateQ, localUpdateErr := tx.Preparex(updateQBaseStr)
		if localUpdateErr != nil {
			Logger.Error("Error occurred during invocation of `boostIngredientProgress`#4", zap.Error(localUpdateErr))
			return nil, localUpdateErr
		}
		var toUpdateState int32
		switch *(completedIngredientProgress.PtrState) {
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED:
			toUpdateState = INGREDIENT_PROGRESS_STATE_COMPLETED_TO_BE_MANUALLY_COLLECTED
		case INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
			INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED:
			toUpdateState = INGREDIENT_PROGRESS_STATE_RECLAIMED_TO_BE_MANUALLY_COLLECTED
		default:
			panic("Unexpected *(completedIngredientProgress.PtrState)!")
		}
		updateResult := updateQ.MustExec(toUpdateState, nowMillis, completedIngredientProgress.Id)
		rowsUpdated, localUpdateErr := updateResult.RowsAffected()
		if localUpdateErr != nil {
			Logger.Error("Error occurred during invocation of `boostIngredientProgress`#5", zap.Error(localUpdateErr))
			return nil, localUpdateErr
		}
		if 0 < rowsUpdated {
			// TODO
		}
	}

	ingredientProgressList, err = QueryIngredientProgressListByPlayerBuildableBindingId(tx, forPlayerId, *pForPlayerBuildableBindingId)
	if nil != err {
		Logger.Error("Error occurred during invocation of `boostIngredientProgress`#11", zap.Error(err))
		return nil, err
	}
	return ingredientProgressList, nil
}

func boostIngredientProgressAndMoveToKnapsackIfApplicable(tx *sqlx.Tx, forPlayerId int32, pForPlayerBuildableBindingId *int32) (ingredientProgressList []*IngredientProgress, retErr error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	if nil == pForPlayerBuildableBindingId {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?) ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId, INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?) AND player_buildable_binding_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
		query, args, err = sqlx.In(queryBaseStr, forPlayerId, INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED, INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED, *pForPlayerBuildableBindingId)
	}

	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgressAndMoveToKnapsackIfApplicable`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgressAndMoveToKnapsackIfApplicable`#2", zap.Error(err))
		return nil, err
	}

	toInspectList := []*IngredientProgress{}
	err = tx.Select(&toInspectList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `boostIngredientProgressAndMoveToKnapsackIfApplicable`#3", zap.Error(err))
		return nil, err
	}

	toUpsertList := []*IngredientProgress{}

	// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#1", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toInspectList", toInspectList))

	for _, ingredientProgress := range toInspectList {
		toUpsertList = append(toUpsertList, ingredientProgress)
	}

	/*
	 * Putting completed "ingredient_progress" records into "knapsack".
	 */
	// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#2", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("toUpsertList", toUpsertList))

	for _, completedIngredientProgress := range toUpsertList {
		//rowsAffected, localErr := UpsertKnapsackRecord(tx, *completedIngredientProgress.IngredientId, increCount, completedIngredientProgress.OwnerPlayerId)
		var recipeId *int32
		if completedIngredientProgress.RecipeId == nil {
			recipeId = nil
		} else {
			recipeId = new(int32)
			*recipeId = int32(completedIngredientProgress.RecipeId.Int64)
		}
		rowsAffected, localErr := UpsertKnapsackRecordByRecipeTarget(
			tx,
			recipeId,
			completedIngredientProgress.IngredientId,
			completedIngredientProgress.TargetIngredientCount,
			completedIngredientProgress.OwnerPlayerId)
		if localErr != nil {
			Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#4", zap.Error(localErr))
			return nil, localErr
		}
		// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#3, inserted a `knapsack` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsAffected", rowsAffected))
		if 0 < rowsAffected {
			deleteBaseStr := fmt.Sprintf("DELETE FROM %s WHERE id=?", TBL_INGREDIENT_PROGRESS)
			deleteQ, localDelErr := tx.Preparex(deleteBaseStr)
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#5", zap.Error(localDelErr))
				return nil, localDelErr
			}
			deletedResult := deleteQ.MustExec(completedIngredientProgress.Id)
			rowsDeleted, localDelErr := deletedResult.RowsAffected()
			if localDelErr != nil {
				Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#6", zap.Error(localDelErr))
				return nil, localDelErr
			}
			// Logger.Info("\tcheckIngredientCompletionAndMoveToKnapsackIfApplicable#4, deleted an `ingredient_progress` record", zap.Any("forPlayerId", forPlayerId), zap.Any("forPlayerBuildableBindingId", *pForPlayerBuildableBindingId), zap.Any("completedIngredientProgress", completedIngredientProgress), zap.Any("rowsDeleted", rowsDeleted))
			if 0 < rowsDeleted {
			}
		}
	}

	ingredientProgressList, err = QueryIngredientProgressListByPlayerBuildableBindingId(tx, forPlayerId, *pForPlayerBuildableBindingId)
	if nil != err {
		Logger.Error("Error occurred during invocation of `checkIngredientCompletionAndMoveToKnapsackIfApplicable`#11", zap.Error(err))
		return nil, err
	}
	return ingredientProgressList, nil
}

func QueryUncollectedPlayerIngredientProgressByPlayerId(tx *sqlx.Tx, playerId int32) ([]*IngredientProgress, error) {
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND state IN (?,?,?,?,?,?) ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
	query, args, err := sqlx.In(queryBaseStr, playerId,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED,
		INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED,
	)

	if err != nil {
		return nil, err
	}
	query = tx.Rebind(query)

	var resultList []*IngredientProgress
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		return nil, err
	}

	return resultList, nil
}

func QueryTargetIngredientProgressByPlayerId(tx *sqlx.Tx, playerId int32, ingredientId int32) ([]*IngredientProgress, error) {
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE owner_player_id=? AND ingredient_id=? ORDER BY created_at ASC FOR UPDATE", TBL_INGREDIENT_PROGRESS)
	query, args, err := sqlx.In(queryBaseStr, playerId, ingredientId)

	if err != nil {
		return nil, err
	}
	query = tx.Rebind(query)

	var resultList []*IngredientProgress
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		return nil, err
	}

	return resultList, nil
}
