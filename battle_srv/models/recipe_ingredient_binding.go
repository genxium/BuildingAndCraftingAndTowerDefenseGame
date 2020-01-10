package models

import (
	"fmt"
	"github.com/jmoiron/sqlx"
)

type RecipeIngredientBinding struct {
	Id                         int32   `json:"id" db:"id"`
	RecipeId                   int32   `json:"recipeId" db:"recipe_id"`
	IngredientId               int32   `json:"ingredientId" db:"ingredient_id"`
	Count                      int32   `json:"count" db:"count"`
	PrependedBinocularOperator *string `json:"prependedBinocularOperator" db:"prepended_binocular_operator"`
}

func (s *RecipeIngredientBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_RECIPE_INGREDIENT_BINDING,
		[]string{"id", "recipe_id", "ingredient_id", "count", "prepended_binocular_operator"},
		[]interface{}{s.Id, s.RecipeId, s.IngredientId, s.Count, s.PrependedBinocularOperator})
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

func GetRecipeTargetIngredientBindingList(tx *sqlx.Tx, forRecipeId int32) ([]*RecipeIngredientBinding, error) {
	var toRet []*RecipeIngredientBinding
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE prepended_binocular_operator='=' and recipe_id=?", TBL_RECIPE_INGREDIENT_BINDING)
	query, args, err := sqlx.In(queryBaseStr, forRecipeId)

	if err != nil {
		return nil, err
	}

	query = tx.Rebind(query)
	err = tx.Select(&toRet, query, args...)

	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func GetRecipeTargetIngredientList(tx *sqlx.Tx, forRecipeId int32) ([]*Ingredient, error) {
	bindingList, err := GetRecipeTargetIngredientBindingList(tx, forRecipeId)

	if err != nil {
		return nil, err
	}

	ingredientIds := make([]int32, 0)
	for _, binding := range bindingList {
		ingredientIds = append(ingredientIds, binding.IngredientId)
	}

	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE id in (?)", TBL_INGREDIENT)
	var resList []*Ingredient
	query, args, err := sqlx.In(queryBaseStr, ingredientIds)
	err = tx.Select(&resList, query, args...)
	if err != nil {
		return nil, err
	}

	return resList, nil
}

func GetRecipeRequireIngredientBindingList(tx *sqlx.Tx, forRecipeId int32) ([]*RecipeIngredientBinding, error) {
	var toRet []*RecipeIngredientBinding
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE (prepended_binocular_operator IS NULL OR prepended_binocular_operator='+') AND recipe_id=?", TBL_RECIPE_INGREDIENT_BINDING)
	query, args, err := sqlx.In(queryBaseStr, forRecipeId)

	if err != nil {
		return nil, err
	}

	query = tx.Rebind(query)
	err = tx.Select(&toRet, query, args...)

	if err != nil {
		return nil, err
	}

	return toRet, nil
}

func GetAllRecipeIngredientBindingListMap(tx *sqlx.Tx) (map[int32][]*RecipeIngredientBinding, error) {
	var totalList []*RecipeIngredientBinding
	queryBaseStr := fmt.Sprintf("SELECT * FROM %s", TBL_RECIPE_INGREDIENT_BINDING)
	query, args, err := sqlx.In(queryBaseStr)

	if err != nil {
		return nil, err
	}

	query = tx.Rebind(query)
	err = tx.Select(&totalList, query, args...)

	if err != nil {
		return nil, err
	}

	resMap := make(map[int32][]*RecipeIngredientBinding)
	for _, binding := range totalList {
		if resMap[binding.RecipeId] == nil {
			resMap[binding.RecipeId] = make([]*RecipeIngredientBinding, 0)
		}
		resMap[binding.RecipeId] = append(resMap[binding.RecipeId], binding)
	}

	return resMap, nil
}
