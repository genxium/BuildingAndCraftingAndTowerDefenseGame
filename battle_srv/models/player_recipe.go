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
	"strings"
)

type PlayerRecipe struct {
	ID                                 int32                      `json:"id" db:"id"`
	PlayerID                           int32                      `json:"playerId" db:"player_id"`
	RecipeID                           *NullInt64                 `json:"recipeId" db:"recipe_id"`
	IngredientId                       *NullInt64                 `json:"ingredientId" db:"ingredient_id"`
	State                              int32                      `json:"state" db:"state"`
	CreatedAt                          int64                      `json:"createdAt" db:"created_at"`
	UpdatedAt                          *NullInt64                 `json:"updatedAt" db:"updated_at"`
	ToUnlockSimultaneouslyRecipeIdList *string                    `json:"toUnlockSimultaneouslyRecipeIdList" db:"to_unlock_simultaneously_recipe_id_list"`
	Recipe                             *Recipe                    `json:"recipe"`
	Consumables                        []*RecipeIngredientBinding `json:"consumables"`
}

type PlayerRecipeResp struct {
	ID                          int32                      `json:"id"`
	PlayerID                    int32                      `json:"playerId"`
	RecipeID                    *NullInt64                 `json:"recipeId"`
	IngredientId                *NullInt64                 `json:"ingredientId"`
	State                       int32                      `json:"state"`
	CreatedAt                   int64                      `json:"createdAt"`
	UpdatedAt                   *NullInt64                 `json:"updatedAt"`
	Recipe                      *Recipe                    `json:"recipe"`
	TargetIngredient            *Ingredient                `json:"targetIngredient"`
	RecipeIngredientBindingList []*RecipeIngredientBinding `json:"recipeIngredientBindingList"`
	TargetIngredientList        []*Ingredient              `json:"targetIngredientList"`
}

const (
	PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN = 1
	PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN   = 2
	PLAYER_RECIPE_UNLOCKED                                = 3
	PLAYER_RECIPE_LOCKED_INGREDIENT_KNOWN                 = 4
)

func AddPlayerUnknownRecipe(tx *sqlx.Tx, playerId int32) error {
	recipeList, err := GetAllRecipeList(tx, []int{})
	if err != nil {
		return err
	}

	for _, recipe := range recipeList {
		nowMillis := utils.UnixtimeMilli()
		_, err = txInsert(tx, TBL_PLAYER_RECIPE, []string{"player_id", "recipe_id", "state",
			"created_at", "updated_at", "to_unlock_simultaneously_recipe_id_list",
		}, []interface{}{
			playerId, recipe.Id, PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN,
			nowMillis, nowMillis, recipe.ToUnlockSimultaneouslyRecipeIdList,
		})
		if err != nil {
			return err
		}
	}

	return nil
}

func InsertPlayerRecipe(tx *sqlx.Tx, playerId int32, playerRecipe *pb.PlayerRecipe) error {
	// Logger.Info("InsertPlayerRecipe", zap.Any("playerId", playerId), zap.Any("playerRecipe", playerRecipe))
	nowMillis := utils.UnixtimeMilli()
	var err error
	if 0 != playerRecipe.RecipeId && 0 == playerRecipe.IngredientId {
		_, err = txInsert(tx, TBL_PLAYER_RECIPE, []string{"player_id", "recipe_id", "state",
			"created_at", "updated_at",
		}, []interface{}{
			playerId, playerRecipe.RecipeId, playerRecipe.State,
			nowMillis, nowMillis,
		})
	} else if 0 != playerRecipe.IngredientId && 0 == playerRecipe.RecipeId {
		_, err = txInsert(tx, TBL_PLAYER_RECIPE, []string{"player_id", "ingredient_id", "state",
			"created_at", "updated_at",
		}, []interface{}{
			playerId, playerRecipe.IngredientId, playerRecipe.State,
			nowMillis, nowMillis,
		})
	} else if 0 != playerRecipe.IngredientId && 0 != playerRecipe.RecipeId {
		_, err = txInsert(tx, TBL_PLAYER_RECIPE, []string{"player_id", "recipe_id", "ingredient_id", "state",
			"created_at", "updated_at",
		}, []interface{}{
			playerId, playerRecipe.RecipeId, playerRecipe.IngredientId, playerRecipe.State,
			nowMillis, nowMillis,
		})
	} else {
		return nil
	}
	if err != nil {
		return err
	}

	return nil
}

func AddPlayerProducibleIngredient(tx *sqlx.Tx, playerId int32, ingredientId int32) (bool, error) {
	exist, err := txExist(tx, TBL_PLAYER_RECIPE, sq.Eq{"player_id": playerId, "ingredient_id": ingredientId})
	nowMillis := utils.UnixtimeMilli()
	if exist {
		updateQBaseStr := fmt.Sprintf("UPDATE %s SET state=?,updated_at=? WHERE player_id=? and ingredient_id=? and state=?", TBL_PLAYER_RECIPE)
		updateQ, err := tx.Preparex(updateQBaseStr)
		if err != nil {
			return false, err
		}

		updateResult := updateQ.MustExec(PLAYER_RECIPE_UNLOCKED, nowMillis, playerId, ingredientId, PLAYER_RECIPE_LOCKED_INGREDIENT_KNOWN)
		rowCount, err := updateResult.RowsAffected()
		if err != nil || rowCount == 0 {
			return false, err
		}
		return true, nil
	}
	if err != nil {
		return false, err
	}

	_, err = txInsert(tx, TBL_PLAYER_RECIPE, []string{"player_id", "ingredient_id", "state",
		"created_at", "updated_at",
	}, []interface{}{
		playerId, ingredientId, PLAYER_RECIPE_UNLOCKED,
		nowMillis, nowMillis,
	})
	if err != nil {
		return false, err
	}
	return true, nil
}

func UnlockPlayerRecipe(tx *sqlx.Tx, forPlayerId int32, recipeId int32) (bool, error) {
	prePlayerRecipeList, err := getPlayerRecipeListByPlayerId(tx, forPlayerId)
	if err != nil {
		return false, err
	}

	_, err = updatePlayerRecipeState(tx, forPlayerId, recipeId, PLAYER_RECIPE_UNLOCKED)
	if err != nil {
		return false, err
	}

	postPlayerRecipeList, err := getPlayerRecipeListByPlayerId(tx, forPlayerId)
	if err != nil {
		return false, err
	}

	hasMissionCompleted, err := CheckMissionCompletionAndAllocateIfApplicable(
		tx,
		forPlayerId,
		nil,
		nil,
		prePlayerRecipeList,
		postPlayerRecipeList,
		nil,
		nil,
	)

	return hasMissionCompleted, err
}

func updatePlayerRecipeState(tx *sqlx.Tx, playerId int32, recipeId int32, state int32) (bool, error) {
	nowMillis := utils.UnixtimeMilli()
	var playerRecipe PlayerRecipe
	err := txGetObj(tx, TBL_PLAYER_RECIPE, sq.Eq{"player_id": playerId, "recipe_id": recipeId}, &playerRecipe)
	if err != nil || playerRecipe.ID == 0 {
		return false, err
	}

	updateQBaseStr := fmt.Sprintf("UPDATE %s SET state=?,updated_at=? WHERE player_id=? and recipe_id=? and state<?", TBL_PLAYER_RECIPE)
	updateQ, err := tx.Preparex(updateQBaseStr)
	if err != nil {
		return false, err
	}

	updateResult := updateQ.MustExec(state, nowMillis, playerId, recipeId, state)
	_, err = updateResult.RowsAffected()
	if err != nil {
		return false, err
	}

	if playerRecipe.ToUnlockSimultaneouslyRecipeIdList != nil {
		idList := strings.Split(*playerRecipe.ToUnlockSimultaneouslyRecipeIdList, ",")
		for _, id := range idList {
			updateResult := updateQ.MustExec(state, nowMillis, playerId, id, state)
			_, err = updateResult.RowsAffected()
			if err != nil {
				return false, err
			}
		}
	}

	return true, nil
}

func GetPlayerRecipeState(tx *sqlx.Tx, playerId int32, recipeId int32) (int32, error) {
	var playerRecipe PlayerRecipe
	err := txGetObj(tx, TBL_PLAYER_RECIPE, sq.Eq{"player_id": playerId, "recipe_id": recipeId}, &playerRecipe)
	if err != nil {
		return 0, err
	}

	return playerRecipe.State, nil
}

func (p *PlayerRecipe) toPlayerRecipeResp() *PlayerRecipeResp {
	return &PlayerRecipeResp{
		ID:           p.ID,
		PlayerID:     p.PlayerID,
		RecipeID:     p.RecipeID,
		IngredientId: p.IngredientId,
		State:        p.State,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

func GetPlayerRecipe(tx *sqlx.Tx, playerId int32) ([]*PlayerRecipeResp, error) {
	var playerRecipeList []*PlayerRecipe

	err := getList(tx, TBL_PLAYER_RECIPE, sq.Eq{"player_id": playerId}, &playerRecipeList)
	if err != nil {
		return nil, err
	}

	respList := make([]*PlayerRecipeResp, len(playerRecipeList))

	recipeMap, err := GetAllRecipeMap(tx, []int{} /* Deliberately left blank to allow those with `nil == player_recipe.recipe_id`. -- YFLu */)
	if err != nil {
		return nil, err
	}

	ingredientMap, err := GetAllIngredientMap(tx)
	if err != nil {
		return nil, err
	}

	recipeIngredientBindingListMap, err := GetAllRecipeIngredientBindingListMap(tx)
	if err != nil {
		return nil, err
	}

	for index, playerRecipe := range playerRecipeList {
		resp := playerRecipe.toPlayerRecipeResp()
		ptrTargetRecipeId := playerRecipe.RecipeID
		if nil != ptrTargetRecipeId && 0 != int32(ptrTargetRecipeId.Int64) {
			recipe, ok := recipeMap[int32(ptrTargetRecipeId.Int64)]
			if false == ok {
				Logger.Warn("Invalid array referencing", zap.Any("playerRecipe.RecipeID.Int64", playerRecipe.RecipeID.Int64), zap.Any("recipeMap", recipeMap))
				continue
			}
			resp.Recipe = recipe
			if recipe.TargetIngredientId != nil {
				resp.TargetIngredient = ingredientMap[*(recipe.TargetIngredientId)]
			} else {
				bindingList, err := GetRecipeTargetIngredientList(tx, recipe.Id)
				if err != nil {
					return nil, err
				}
				resp.TargetIngredientList = bindingList
			}

			resp.RecipeIngredientBindingList = recipeIngredientBindingListMap[recipe.Id]
		} else {
			if playerRecipe.IngredientId != nil {
				resp.TargetIngredient = ingredientMap[int32(playerRecipe.IngredientId.Int64)]
			}
		}
		respList[index] = resp
	}

	return respList, err
}

/**
check whether recipe/ingredient exist in playerRecipeList
*/
func checkNameKnownInPlayerRecipeList(playerRecipeList []*PlayerRecipe, recipeId int32, ingredientId int32) bool {
	if len(playerRecipeList) == 0 {
		return false
	}
	if recipeId != 0 {
		recipeIdInt64 := int64(recipeId)
		containsRecipeId := false
		for _, playerRecipe := range playerRecipeList {
			if nil != playerRecipe.RecipeID && playerRecipe.RecipeID.Int64 == recipeIdInt64 {
				containsRecipeId = true
				if playerRecipe.State == PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN {
					return false
				} else {
					return true
				}
			}
		}
		if !containsRecipeId {
			return true
		}
	}
	if ingredientId != 0 {
		ingredientIdInt64 := int64(ingredientId)
		for _, playerRecipe := range playerRecipeList {
			if nil != playerRecipe.IngredientId && playerRecipe.IngredientId.Int64 == ingredientIdInt64 {
				if playerRecipe.State == PLAYER_RECIPE_LOCKED_INGREDIENT_KNOWN {
					return false
				}
				return true
			}
		}
	}
	return false
}

func isBuildableCompletedInBuildableList(
	buildableBuildingList []*pb.PlayerBuildableBinding,
	requiredBuildableId int32,
	requireLevel int32,
) bool {
	if len(buildableBuildingList) == 0 {
		return false
	}

	for _, binding := range buildableBuildingList {
		if binding.GetBuildable().GetId() == requiredBuildableId && binding.GetCurrentLevel() >= requireLevel {
			return true
		}
	}

	return false
}

func isProducible(interactionList []*BuildableIngredientInteraction, ingredientId int32) bool {
	for _, interaction := range interactionList {
		if interaction.Type == BUILDABLE_INGREDIENT_INTERACTION_PRODUCIBLE && *interaction.IngredientId == ingredientId {
			return true
		}
	}

	return false
}

func getPlayerRecipeListByPlayerId(tx *sqlx.Tx, playerId int32) ([]*PlayerRecipe, error) {
	var playerRecipeList []*PlayerRecipe

	query, args, err := sq.Select("*").
		From(TBL_PLAYER_RECIPE).
		Where(sq.Eq{"player_id": playerId}).
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&playerRecipeList, query, args...)

	if err != nil {
		return nil, err
	}

	return playerRecipeList, nil
}

func UpdatePlayerRecipeStateBySyncData(tx *sqlx.Tx, playerId int32, syncData *pb.SyncDataStruct) error {
	buildableIngredientInteractionList, err := GetAllBuildableIngredientInteraction(tx)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		return err
	}

	playerRecipeList, err := getPlayerRecipeListByPlayerId(tx, playerId)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		return err
	}

	recipeList, err := GetAllRecipeList(tx, []int{} /* Deliberately left blank to allow those with `nil == player_recipe.recipe_id`. -- YFLu */)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		return err
	}

	ingredientList, err := QueryAllIngredientList(tx, 0)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		return err
	}

	// update recipe state
	for _, recipe := range recipeList {
		if !checkNameKnownInPlayerRecipeList(playerRecipeList, recipe.Id, 0) {
			buildableCompleted := true
			for _, interaction := range buildableIngredientInteractionList {
				if interaction.Type != BUILDABLE_INGREDIENT_INTERACTION_WILL_UNLOCK_RECIPE || recipe.Id != *interaction.RecipeId {
					continue
				}
				if !isBuildableCompletedInBuildableList(syncData.PlayerBuildableBindingList, interaction.BuildableId, interaction.BuildableLevelToUnlockDisplayName) {
					buildableCompleted = false
					break
				}
			}

			if buildableCompleted {
				_, err := updatePlayerRecipeState(tx, playerId, recipe.Id, PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN)
				if err != nil {
					Logger.Warn("mysql err\n", zap.Any("err:", err))
					return err
				}
			}
		}
	}

	// update producible state
	for _, ingredient := range ingredientList {
		if !isProducible(buildableIngredientInteractionList, ingredient.ID) {
			continue
		}
		if !checkNameKnownInPlayerRecipeList(playerRecipeList, 0, ingredient.ID) {
			buildableCompleted := true
			for _, interaction := range buildableIngredientInteractionList {
				if interaction.Type != BUILDABLE_INGREDIENT_INTERACTION_PRODUCIBLE || (*interaction.IngredientId) != ingredient.ID {
					continue
				}
				if !isBuildableCompletedInBuildableList(syncData.PlayerBuildableBindingList, interaction.BuildableId, interaction.BuildableLevelToUnlockDisplayName) {
					buildableCompleted = false
					break
				}
			}

			if buildableCompleted {
				_, err := AddPlayerProducibleIngredient(tx, playerId, ingredient.ID)
				if err != nil {
					Logger.Warn("mysql err\n", zap.Any("err:", err))
					return err
				}
			}
		}
	}

	return nil
}

/**
compose a id-PlayerRecipe map with interaction type(SYNTHESIZABLE/WILL_UNLOCK_RECIPE) checking
will get statefulBuildable in player sync data
*/
func ComposePlayerSynthesisRecipeMapWithBuildableId(tx *sqlx.Tx, playerId int32, statefulBuildableId int32) (map[int32]*PlayerRecipe, error) {
	var playerRecipeList []*PlayerRecipe

	var query string
	var queryBaseStr string
	var args []interface{}
	var err error

	queryBaseStr = fmt.Sprintf("SELECT * FROM %s WHERE player_id=? AND state IN (?,?) AND recipe_id IS NOT NULL", TBL_PLAYER_RECIPE)

	query, args, err = sqlx.In(queryBaseStr, playerId, PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN, PLAYER_RECIPE_UNLOCKED)

	if err != nil {
		return nil, err
	}
	err = tx.Select(&playerRecipeList, query, args...)

	if err == sql.ErrNoRows {
		return nil, err
	}

	var recipeIdList []int
	for _, playerRecipe := range playerRecipeList {
		recipeIdList = append(recipeIdList, int(playerRecipe.RecipeID.Int64))
	}

	recipeMap, err := GetAllRecipeMap(tx, recipeIdList)
	if err != nil {
		return nil, err
	}
	/*
		playerBuildableBindingMap, err := ComposePlayerBuildableBindingMapByPlayerId(tx, playerId)
		if err != nil {
			return nil, err
		}

		playerMaxBuildableLevelMap, err := ComposePlayerMaxBuildableLevelMapByPlayerId(tx, playerId)
		if err != nil {
			return nil, err
		}


		currentBuildableId := playerBuildableBindingMap[statefulBuildableId].Buildable.Id
		currentLevel := playerBuildableBindingMap[statefulBuildableId].CurrentLevel

		var synthesizableInteractionList []*BuildableIngredientInteraction
		query, args, err = sq.Select("*").
			From(TBL_BUILDABLE_INGREDIENT_INTERACTION).
			Where(sq.Eq{
				"type":         BUILDABLE_INGREDIENT_INTERACTION_SYNTHESIZABLE,
				"recipe_id":    recipeIdList,
				"buildable_id": currentBuildableId,
			}).
			ToSql()

		if err != nil {
			return nil, err
		}
		err = tx.Select(&synthesizableInteractionList, query, args...)
		if err != nil {
			return nil, err
		}
	*/

	var unlockInteractionList []*BuildableIngredientInteraction
	query, args, err = sq.Select("*").
		From(TBL_BUILDABLE_INGREDIENT_INTERACTION).
		Where(sq.Eq{
			"type":      BUILDABLE_INGREDIENT_INTERACTION_WILL_UNLOCK_RECIPE,
			"recipe_id": recipeIdList,
		}).
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&unlockInteractionList, query, args...)
	if err != nil {
		return nil, err
	}

	recipeIngredientBindingListMap, err := GetAllRecipeIngredientBindingListMap(tx)
	if err != nil {
		return nil, err
	}

	resMap := make(map[int32]*PlayerRecipe)

	for _, playerRecipe := range playerRecipeList {
		/*
			isTargetBuildable := false
			for _, interaction := range synthesizableInteractionList {
				if interaction.BuildableId == currentBuildableId &&
					(*interaction.RecipeId) == int32(playerRecipe.RecipeID.Int64) &&
					currentLevel >= interaction.BuildableLevelToUnlockDisplayName {
					isTargetBuildable = true
				}
			}
			if !isTargetBuildable {
				continue
			}


			if playerRecipe.State != PLAYER_RECIPE_UNLOCKED {
				isAbleToUnlock := true
				for _, interaction := range unlockInteractionList {
					if (*interaction.RecipeId) == int32(playerRecipe.RecipeID.Int64) {
						buildableMaxLevel, ok := playerMaxBuildableLevelMap[interaction.BuildableId]
						if !ok {
							buildableMaxLevel = 0
						}
						if buildableMaxLevel < interaction.BuildableLevelToUnlockDisplayName {
							isAbleToUnlock = false
							break
						}
					}
				}
				if !isAbleToUnlock {
					continue
				}
			}
		*/

		recipe := recipeMap[int32(playerRecipe.RecipeID.Int64)]
		playerRecipe.Recipe = recipe
		playerRecipe.Consumables = make([]*RecipeIngredientBinding, 0)
		associatedRecipeIngredientBindingList := recipeIngredientBindingListMap[recipe.Id]
		for _, recipeIngredientBinding := range associatedRecipeIngredientBindingList {
			if nil == recipeIngredientBinding.PrependedBinocularOperator || "" == *(recipeIngredientBinding.PrependedBinocularOperator) || "+" == *(recipeIngredientBinding.PrependedBinocularOperator) {
				playerRecipe.Consumables = append(playerRecipe.Consumables, recipeIngredientBinding)
			}
		}
		resMap[int32(playerRecipe.RecipeID.Int64)] = playerRecipe
	}

	return resMap, err
}

func QueryPlayerMatchedRecipes(
	tx *sqlx.Tx,
	ingredientCollectionToCheck map[int32]*IngredientWithCount,
	playerId int32,
	targetBuildableId int32,
) ([]*Recipe, error) {

	toRet := make([]*Recipe, 0)
	playerRecipeMap, err := ComposePlayerSynthesisRecipeMapWithBuildableId(tx, playerId, targetBuildableId)
	Logger.Info("check player recipe map", zap.Any("player recipe map", playerRecipeMap))
	if err != nil {
		return nil, err
	}

	for _, playerRecipe := range playerRecipeMap {
		matched := true
		if len(playerRecipe.Consumables) != len(ingredientCollectionToCheck) {
			matched = false
			continue
		}
		for _, recipeIngredientBinding := range playerRecipe.Consumables {
			theIngredientWithCount, ingredientInCollection := ingredientCollectionToCheck[recipeIngredientBinding.IngredientId]
			if !ingredientInCollection || recipeIngredientBinding.Count != theIngredientWithCount.Count {
				matched = false
				break
			}
		}
		if matched {
			toRet = append(toRet, playerRecipe.Recipe)
		}
	}

	return toRet, nil
}
