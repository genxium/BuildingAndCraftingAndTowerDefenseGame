package models

import (
	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"server/common/utils"
	pb "server/pb_output"
)

type PlayerIngredientForIdleGame struct {
	CreatedAt    int64 `json:"-" db:"created_at"`
	ID           int32 `json:"id" db:"id"`
	PlayerID     int32 `json:"-" db:"player_id"`
	IngredientID int32 `json:"ingredientId" db:"ingredient_id"`
	State        int32 `json:"state" db:"state"`
	UpdatedAt    int64 `json:"-" db:"updated_at"`
}

const (
	PLAYER_INGREDIENT_FOR_IDLE_GAME_LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK = 2
	PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED                                = 3
)

func InsertPlayerIngredientForIdleGame(
	tx *sqlx.Tx,
	playerID int32,
	ingredientID int32,
	state int,
) error {
	now := utils.UnixtimeMilli()
	_, err := txInsert(tx, TBL_PLAYER_INGREDIENT_FOR_IDLE_GAME,
		[]string{"player_id", "ingredient_id", "state", "created_at", "updated_at"},
		[]interface{}{playerID, ingredientID, state, now, now})
	if err != nil {
		return err
	}
	return nil
}

func UpdatePlayerIngredientForIdleGameState(
	tx *sqlx.Tx,
	playerID int32,
	ingredientID int32,
	state int,
) error {
	now := utils.UnixtimeMilli()
	var obj PlayerIngredientForIdleGame
	err := txGetObjForUpdate(tx, TBL_PLAYER_INGREDIENT_FOR_IDLE_GAME,
		squirrel.Eq{"player_id": playerID, "ingredient_id": ingredientID}, &obj)

	query, args, err := squirrel.Update(TBL_PLAYER_INGREDIENT_FOR_IDLE_GAME).
		Set("state", state).
		Set("updated_at", now).
		Where(squirrel.Eq{"player_id": playerID, "ingredient_id": ingredientID}).
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

func GetPlayerIngredientForIdleGameStateByPlayer(
	tx *sqlx.Tx,
	playerID int32,
) ([]*PlayerIngredientForIdleGame, error) {
	var tmp []*PlayerIngredientForIdleGame

	err := getList(tx, TBL_PLAYER_INGREDIENT_FOR_IDLE_GAME, squirrel.Eq{"player_id": playerID}, &tmp)
	if err != nil {
		return nil, err
	}
	return tmp, nil
}

func CheckSyncDataToInsertPlayerIngredientForIdleGameState(
	tx *sqlx.Tx,
	playerID int32,
	syncData *pb.SyncDataStruct,
) error {

	maxBuildableLevelMap := ComposePlayerMaxBuildableLevelMap(syncData)

	freeOrderInteractionMap, err := ComposeFreeOrderInteractionMap(tx)
	if err != nil {
		return err
	}

	for ingredientId, interactionList := range freeOrderInteractionMap {
		meetTheNeed := true
		for _, interaction := range interactionList {
			maxLevel, ok := maxBuildableLevelMap[interaction.BuildableId]
			if !ok || maxLevel < interaction.BuildableLevelToUnlockDisplayName {
				meetTheNeed = false
				break
			}
		}
		if meetTheNeed {
			exist, err := txExist(tx, TBL_PLAYER_INGREDIENT_FOR_IDLE_GAME,
				squirrel.Eq{"player_id": playerID, "ingredient_id": ingredientId})
			if err != nil {
				return err
			}
			if !exist {
				state := PLAYER_INGREDIENT_FOR_IDLE_GAME_LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK
				if interactionList[0].IngredientPurchasePriceValue == 0 {
					state = PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED
				}
				err := InsertPlayerIngredientForIdleGame(tx, playerID, ingredientId, state)
				if err != nil {
					return err
				}
			}
		}
	}

	return nil
}

func ClaimPurchaseIngredientList(
	tx *sqlx.Tx,
	playerID int32,
	toClaimPurchaseIngredientList []int32) error {
	for _, ingredientId := range toClaimPurchaseIngredientList {
		err := UpdatePlayerIngredientForIdleGameState(tx, playerID, ingredientId, PLAYER_INGREDIENT_FOR_IDLE_GAME_UNLOCKED)
		if err != nil {
			return err
		}
	}
	return nil
}

func PlayerIngredientForIdleGameListToMap(list []*PlayerIngredientForIdleGame) map[int32]*PlayerIngredientForIdleGame {
	res := make(map[int32]*PlayerIngredientForIdleGame)
	for _, binding := range list {
		res[binding.IngredientID] = binding
	}
	return res
}
