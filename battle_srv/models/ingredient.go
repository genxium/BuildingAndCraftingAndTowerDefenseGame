package models

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
)

const (
	INGREDIENT_CATEGORY_FREEORDER         = 0
	INGREDIENT_CATEGORY_BATTLE_CONSUMABLE = 1
	INGREDIENT_CATEGORY_SOLDIER           = 1000
	INGREDIENT_CATEGORY_TECH              = 2000
)

type Ingredient struct {
	ID                           int32  `json:"id" db:"id"`
	Name                         string `json:"name" db:"name"`
	PriceCurrency                int32  `json:"priceCurrency" db:"price_currency"`
	PriceValue                   int32  `json:"priceValue" db:"price_value"`
	BaseProductionDurationMillis int32  `json:"baseProductionDurationMillis" db:"base_production_duration_millis"`

	ReclaimPriceCurrency      int32 `json:"reclaimPriceCurrency" db:"reclaim_price_currency"`
	ReclaimPriceValue         int32 `json:"reclaimPriceValue" db:"reclaim_price_value"`
	BaseReclaimDurationMillis int32 `json:"baseReclaimDurationMillis" db:"base_reclaim_duration_millis"`
	Category                  int32 `json:"category" db:"category"`
	ResidenceOccupation       int32 `json:"residenceOccupation" db:"residence_occupation"`
}

func QueryOneIngredient(tx *sqlx.Tx, forIngredientId int32, forUpdate bool /* Possibly useless param forever... */) (*Ingredient, error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	if false == forUpdate {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? LIMIT 1", TBL_INGREDIENT)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? LIMIT 1 FOR UPDATE ", TBL_INGREDIENT)
	}

	query, args, err = sqlx.In(queryBaseStr, forIngredientId)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredient`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredient`#2", zap.Error(err))
		return nil, err
	}

	resultList := make([]*Ingredient, 0)
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneIngredient`#3", zap.Error(err))
		return nil, err
	}

	if 0 >= len(resultList) {
		Logger.Error("Error occurred during invocation of `QueryOneIngredient`#4", zap.Error(err))
		return nil, err
	}

	return resultList[0], nil
}

func (p *Ingredient) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_INGREDIENT, []string{"id", "price_currency",
		"price_value", "name", "base_production_duration_millis", "reclaim_price_currency", "reclaim_price_value", "base_reclaim_duration_millis", "category", "residence_occupation"},
		[]interface{}{p.ID, p.PriceCurrency, p.PriceValue, p.Name, p.BaseProductionDurationMillis, p.ReclaimPriceCurrency, p.ReclaimPriceValue, p.BaseReclaimDurationMillis, p.Category, p.ResidenceOccupation})
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

func QueryAllIngredientList(tx *sqlx.Tx, forPlayerBuildableBindingId int32) ([]*Ingredient, error) {
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s", TBL_INGREDIENT)
	query, args, err := sqlx.In(queryBaseStr)

	if err != nil {
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		return nil, err
	}

	var toRet []*Ingredient
	err = tx.Select(&toRet, query, args...)
	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func GetAllIngredientMap(tx *sqlx.Tx) (map[int32]*Ingredient, error) {
	ingredientList, err := QueryAllIngredientList(tx, 0)
	if err != nil {
		return nil, err
	}
	//Logger.Info("Get ingredients list", zap.Any("ingredient", ingredientList))

	ingredientMap := make(map[int32]*Ingredient, len(ingredientList))

	for _, ingredient := range ingredientList {
		ingredientMap[ingredient.ID] = ingredient
	}

	//Logger.Info("Get ingredients map", zap.Any("ingredient", ingredientMap))
	return ingredientMap, nil
}

func ComposeMapOfIngredientWithCount(tx *sqlx.Tx, consumables []*Consumable) (map[int32]*Knapsack, map[int32]*IngredientWithCount, error) {
	knapsackRecordIdList := make([]int32, 0)
	for _, consumable := range consumables {
		knapsackRecordIdList = append(knapsackRecordIdList, consumable.KnapsackId)
	}

	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE id IN (?) AND deleted_at IS NULL FOR UPDATE", TBL_KNAPSACK)
	query, args, err := sqlx.In(queryBaseStr, knapsackRecordIdList)
	if err != nil {
		return nil, nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		return nil, nil, err
	}

	knapsackRecordList := make([]*Knapsack, 0)
	err = tx.Select(&knapsackRecordList, query, args...)
	if err != nil {
		return nil, nil, err
	}

	mapOfKnapsackRecord := make(map[int32]*Knapsack, 0)
	ingredientIdList := make([]int32, 0)
	for _, knapsackRecord := range knapsackRecordList {
		ingredientIdList = append(ingredientIdList, knapsackRecord.IngredientId)
		mapOfKnapsackRecord[knapsackRecord.ID] = knapsackRecord
	}

	queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id IN (?)", TBL_INGREDIENT)
	query, args, err = sqlx.In(queryBaseStr, ingredientIdList)
	if err != nil {
		return nil, nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		return nil, nil, err
	}

	listOfIngredientWithCount := make([]*IngredientWithCount, 0)
	err = tx.Select(&listOfIngredientWithCount, query, args...)
	if err != nil {
		return nil, nil, err
	}

	mapOfIngredientWithCount := make(map[int32]*IngredientWithCount, 0)
	for _, ingredientWithCount := range listOfIngredientWithCount {
		mapOfIngredientWithCount[ingredientWithCount.Ingredient.ID] = ingredientWithCount
	}

	for _, consumable := range consumables {
		theIngredientId := mapOfKnapsackRecord[consumable.KnapsackId].IngredientId
		theIngredientWithCount := mapOfIngredientWithCount[theIngredientId]
		theIngredientWithCount.Count = consumable.Count
	}

	return mapOfKnapsackRecord, mapOfIngredientWithCount, nil
}
