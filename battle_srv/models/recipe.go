package models

import (
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
)

type Recipe struct {
	Id                                 int32                      `json:"id" db:"id"`
	DurationMillis                     int32                      `json:"durationMillis" db:"duration_millis"`
	TargetIngredientId                 *int32                     `json:"targetIngredientId" db:"target_ingredient_id"`
	TargetIngredientCount              *int32                     `json:"targetIngredientCount" db:"target_ingredient_count"`
	ToUnlockSimultaneouslyRecipeIdList *string                    `json:"toUnlockSimultaneouslyRecipeIdList" db:"to_unlock_simultaneously_recipe_id_list"`
	RecipeIngredientBindingList        []*RecipeIngredientBinding `json:"recipeIngredientBindingList"`
}

func QueryOneRecipe(tx *sqlx.Tx, forRecipeId int32, forUpdate bool /* Possibly useless param forever... */) (*Recipe, error) {
	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	if false == forUpdate {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? LIMIT 1", TBL_RECIPE)
	} else {
		queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE id=? LIMIT 1 FOR UPDATE ", TBL_RECIPE)
	}

	query, args, err = sqlx.In(queryBaseStr, forRecipeId)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneRecipe`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneRecipe`#2", zap.Error(err))
		return nil, err
	}

	resultList := make([]*Recipe, 0)
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `QueryOneRecipe`#3", zap.Error(err))
		return nil, err
	}

	if 0 >= len(resultList) {
		Logger.Error("Error occurred during invocation of `QueryOneRecipe`#4", zap.Error(err))
		return nil, err
	}

	return resultList[0], nil
}

func (s *Recipe) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_RECIPE,
		[]string{"id", "target_ingredient_id", "duration_millis", "target_ingredient_count", "to_unlock_simultaneously_recipe_id_list"},
		[]interface{}{s.Id, s.TargetIngredientId, s.DurationMillis, s.TargetIngredientCount, s.ToUnlockSimultaneouslyRecipeIdList})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	s.Id = int32(id)
	return nil
}

func GetAllRecipeList(tx *sqlx.Tx, recipeIdList []int) ([]*Recipe, error) {
	var toRet []*Recipe

	var query string
	var args []interface{}
	var err error

	if 1 < len(recipeIdList) {
		query, args, err = sq.Select("*").
			From(TBL_RECIPE).
			Where(sq.Eq{"id": recipeIdList}).
			OrderBy("id asc").
			ToSql()
	} else if 1 == len(recipeIdList) {
		query, args, err = sq.Select("*").
			From(TBL_RECIPE).
			Where(sq.Eq{"id": recipeIdList[0]}).
			OrderBy("id asc").
			ToSql()
	} else {
		query, args, err = sq.Select("*").
			From(TBL_RECIPE).
			OrderBy("id asc").
			ToSql()
	}

	if err != nil {
		return nil, err
	}
	err = tx.Select(&toRet, query, args...)

	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func GetAllRecipeMap(tx *sqlx.Tx, recipeIdList []int) (map[int32]*Recipe, error) {
	recipeList, err := GetAllRecipeList(tx, recipeIdList)
	if err != nil {
		return nil, err
	}

	recipeMap := make(map[int32]*Recipe, len(recipeList))

	for _, recipe := range recipeList {
		recipeMap[recipe.Id] = recipe
	}

	return recipeMap, nil
}

func QueryMatchedRecipes(tx *sqlx.Tx, ingredientCollectionToCheck map[int32]*IngredientWithCount) ([]*Recipe, error) {
	/*
	 * TODO
	 *
	 * Optimize the search in time-complexity.
	 */

	toRet := make([]*Recipe, 0)
	recipeList, err := GetAllRecipeList(tx, []int{})
	if err != nil {
		return nil, err
	}
	for _, recipe := range recipeList {
		recipeIngredientBindingList, err := GetRecipeRequireIngredientBindingList(tx, recipe.Id)
		if err != nil {
			return nil, err
		}

		Logger.Info("Comparing ingredientCollectionToCheck against recipe", zap.Any("recipe", recipe), zap.Any("recipeIngredientBindingList", recipeIngredientBindingList), zap.Any("ingredientCollectionToCheck", ingredientCollectionToCheck))

		matched := true
		if len(recipeIngredientBindingList) != len(ingredientCollectionToCheck) {
			matched = false
			continue
		}
		for _, recipeIngredientBinding := range recipeIngredientBindingList {
			theIngredientWithCount := ingredientCollectionToCheck[recipeIngredientBinding.IngredientId]
			if nil == theIngredientWithCount || recipeIngredientBinding.Count != theIngredientWithCount.Count {
				matched = false
				break
			}
		}
		if matched {
			toRet = append(toRet, recipe)
		}
	}

	return toRet, nil
}
