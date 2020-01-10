package models

import (
	"database/sql"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	utils "server/common/utils"
)

type Knapsack struct {
	ID           int32       `json:"id" db:"id"`
	IngredientId int32       `json:"-" db:"ingredient_id"`
	CurrentCount int32       `json:"currentCount" db:"current_count"`
	PlayerId     int32       `json:"-" db:"player_id"`
	CreatedAt    int64       `json:"-" db:"created_at"`
	UpdatedAt    int64       `json:"-" db:"updated_at"`
	DeletedAt    NullInt64   `json:"-" db:"deleted_at"`
	Ingredient   *Ingredient `json:"ingredient"`
}

func UpsertKnapsackRecord(tx *sqlx.Tx, ingredientId int32, increCount int32, forPlayerId int32) (int64, error) {
	nowMills := utils.UnixtimeMilli()
	upsertQBaseStr := fmt.Sprintf("INSERT INTO %s (ingredient_id, current_count, player_id, created_at, updated_at) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE current_count=current_count+?", TBL_KNAPSACK)
	upsertQ, localErr := tx.Preparex(upsertQBaseStr)
	if localErr != nil {
		return 0, localErr
	}
	upsertedResult := upsertQ.MustExec(ingredientId, increCount, forPlayerId, nowMills, nowMills, increCount)

	/*
			 * According to https://godoc.org/database/sql#Result,
			 *
			 * ```
			 *  "RowsAffected" returns the number of rows affected by an
			 *  update, insert, or delete. Not every database or database
			 *  driver may support this.
			 * ```
			 *
			 * where the "MySQLServer & its driver used in this project" seems to support this method.
		   *
		   * Moreover, the "rowsAffected" should be 2 if the "ON DUPLICATE UPDATE" action is triggered, according to "https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html".
	*/

	return upsertedResult.RowsAffected()
}

func UpsertKnapsackRecordList(tx *sqlx.Tx, bindingList []*RecipeIngredientBinding, forPlayerId int32) (int64, error) {
	nowMills := utils.UnixtimeMilli()
	upsertQBaseStr := fmt.Sprintf("INSERT INTO %s (ingredient_id, current_count, player_id, created_at, updated_at) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE current_count=current_count+?", TBL_KNAPSACK)
	upsertQ, localErr := tx.Preparex(upsertQBaseStr)
	if localErr != nil {
		return 0, localErr
	}
	totalAffected := int64(0)
	for _, binding := range bindingList {
		upsertedResult := upsertQ.MustExec(binding.IngredientId, binding.Count, forPlayerId, nowMills, nowMills, binding.Count)
		affected, err := upsertedResult.RowsAffected()
		if err != nil {
			return 0, err
		}
		totalAffected += affected
	}

	return totalAffected, nil
}

func UpsertKnapsackRecordByRecipeTarget(
	tx *sqlx.Tx,
	recipeId *int32,
	targetIngredientId *int32,
	targetIngredientCount *int32,
	forPlayerId int32,
) (int64, error) {
	if targetIngredientId != nil {
		return UpsertKnapsackRecord(tx, *targetIngredientId, *targetIngredientCount, forPlayerId)
	} else {
		bindingList, err := GetRecipeTargetIngredientBindingList(tx, *recipeId)
		if err != nil {
			return 0, err
		}
		return UpsertKnapsackRecordList(tx, bindingList, forPlayerId)
	}
}

func DecrementKnapsackRecord(tx *sqlx.Tx, ingredientId int32, decreCount int, forPlayerId int32) (int64, error) {
	decrementQBaseStr := fmt.Sprintf("UPDATE %s SET current_count= CASE WHEN current_count>=? THEN current_count-? ELSE 0 END WHERE ingredient_id=? AND player_id=?", TBL_KNAPSACK)
	decrementQ, err := tx.Preparex(decrementQBaseStr)
	if nil != err {
		return 0, err
	}
	decrementedResult := decrementQ.MustExec(decreCount, decreCount, ingredientId, forPlayerId)
	return decrementedResult.RowsAffected()
}

func GetAllKnapsack(tx *sqlx.Tx, playerId int32) ([]*Knapsack, error) {
	var tmp []*Knapsack

	query, args, err := sq.Select("*").
		From(TBL_KNAPSACK).
		Where(sq.Eq{"player_id": playerId}).
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	ingredientIdList := make([]int32, len(tmp))
	for i, knapsack := range tmp {
		ingredientIdList[i] = knapsack.IngredientId
	}
	ingredientMap, err := GetKnapsackByIngredientId(tx, ingredientIdList)

	if nil == ingredientMap {
		return nil, nil
	}

	if nil != err {
		return nil, err
	}

	kList := make([]*Knapsack, len(tmp))
	for i, knapsack := range tmp {
		knapsack.Ingredient = ingredientMap[knapsack.IngredientId]
		kList[i] = knapsack
	}

	return kList, nil
}

func GetKnapsackByIngredientId(tx *sqlx.Tx, ids []int32) (map[int32]*Ingredient, error) {
	var tmp []*Ingredient

	if 0 >= len(ids) {
		return nil, nil
	}

	query, args, err := sqlx.In("select * from ingredient where id in (?)", ids)
	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	len := len(tmp)
	resMap := make(map[int32]*Ingredient, len)
	for _, ingredient := range tmp {
		resMap[ingredient.ID] = ingredient
	}
	return resMap, nil
}

func CalculateOccupiedResidenceCount(tx *sqlx.Tx, playerId int32) (int32, error) {
	ingredients, err := GetAllIngredientMap(tx)
	if err != nil {
		return 0, err
	}

	Knapsacks, err := GetAllKnapsack(tx, playerId)
	if err != nil {
		return 0, err
	}

	var knapsackOccupiedCount int32 = 0
	for _, knapsack := range Knapsacks {
		knapsackOccupiedCount += knapsack.CurrentCount * ingredients[knapsack.IngredientId].ResidenceOccupation
	}

	ingredientProgressList, err := QueryUncollectedPlayerIngredientProgressByPlayerId(tx, playerId)
	if err != nil {
		return 0, err
	}

	for _, progress := range ingredientProgressList {
		if progress.IngredientId != nil {
			knapsackOccupiedCount += ingredients[*progress.IngredientId].ResidenceOccupation * (*progress.TargetIngredientCount)
		} else {
			targetIngredients, err := GetRecipeTargetIngredientBindingList(tx, int32(progress.RecipeId.Int64))
			if err != nil {
				return 0, err
			}
			for _, targetIngredient := range targetIngredients {
				knapsackOccupiedCount += ingredients[targetIngredient.IngredientId].ResidenceOccupation * targetIngredient.Count
			}
		}
	}

	return knapsackOccupiedCount, nil
}

func CalculateOccupiedResidenceCountByIngredientProgressList(tx *sqlx.Tx, playerId int32, ingredientProgressList []*IngredientProgress) (int32, error) {
	ingredients, err := GetAllIngredientMap(tx)
	if err != nil {
		return 0, err
	}

	var occupiedCount int32 = 0

	for _, progress := range ingredientProgressList {
		if progress.IngredientId != nil {
			occupiedCount += ingredients[*progress.IngredientId].ResidenceOccupation * (*progress.TargetIngredientCount)
		} else {
			targetIngredients, err := GetRecipeTargetIngredientBindingList(tx, int32(progress.RecipeId.Int64))
			if err != nil {
				return 0, err
			}
			for _, targetIngredient := range targetIngredients {
				occupiedCount += ingredients[targetIngredient.IngredientId].ResidenceOccupation * targetIngredient.Count
			}
		}
	}

	return occupiedCount, nil
}

func CalculateKnapsackOccupiedResidenceCount(tx *sqlx.Tx, playerId int32) (int32, error) {
	ingredients, err := GetAllIngredientMap(tx)
	if err != nil {
		return 0, err
	}

	knapsacks, err := GetAllKnapsack(tx, playerId)
	if err != nil {
		return 0, err
	}

	var knapsackOccupiedCount int32 = 0
	for _, knapsack := range knapsacks {
		knapsackOccupiedCount += knapsack.CurrentCount * ingredients[knapsack.IngredientId].ResidenceOccupation
	}

	return knapsackOccupiedCount, nil
}

func CalculateAllowedResidenceCount(tx *sqlx.Tx, playerId int32) (int32, error) {
	buildableBindingList, err := GetAllBuildableLevelBinding(tx)
	if err != nil {
		return 0, err
	}

	syncData, err := GetPBEncodedSyncDataByPlayerID(tx, playerId)
	if err != nil {
		return 0, err
	}

	var knapsackAllowedCount int32 = 0
	for _, buildable := range syncData.PlayerBuildableBindingList {
		for _, buildableBinding := range buildableBindingList {
			if buildable.Buildable.Id == buildableBinding.Buildable.Id &&
				buildable.CurrentLevel == buildableBinding.Level {
				knapsackAllowedCount += buildableBinding.BaseFoodProductionRate
			}
		}
	}

	return knapsackAllowedCount, nil
}
