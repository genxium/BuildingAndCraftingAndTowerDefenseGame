package models

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	sq "github.com/Masterminds/squirrel"
	"github.com/golang/protobuf/proto"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	pb "server/pb_output"
)

// Buildable :
type Buildable struct {
	ID             int32  `json:"id" db:"id"`
	Type           int32  `json:"type" db:"type"`
	DiscreteWidth  int32  `json:"discreteWidth" db:"discrete_width"`
	DiscreteHeight int32  `json:"discreteHeight" db:"discrete_height"`
	DisplayName    string `json:"displayName" db:"display_name"`
	AutoCollect    int32  `json:"autoCollect" db:"auto_collect"`
}

// BuildableLevelBinding :
type BuildableLevelBinding struct {
	ID                                        int32   `db:"id"`
	BuildableID                               int32   `db:"buildable_id"`
	Level                                     int32   `db:"level"`
	BuildingOrUpgradingDuration               int32   `db:"building_or_upgrading_duration"`
	BuildingOrUpgradingRequiredGold           int32   `db:"building_or_upgrading_required_gold"`
	BuildingOrUpgradingRequiredResidentsCount int32   `db:"building_or_upgrading_required_residents_count"`
	BaseGoldProductionRate                    float64 `db:"base_gold_production_rate"`
	BaseFoodProductionRate                    int32   `db:"base_food_production_rate"`
	BaseRiflemanProductionRequiredGold        int32   `db:"base_rifleman_production_required_gold"`
	BaseRiflemanProductionDuration            int32   `db:"base_rifleman_production_duration"`
	GoldLimitAddition                         int32   `db:"gold_limit_addition"`
	BaseHp                                    int32   `db:"base_hp"`
	BaseDamage                                int32   `db:"base_damage"`
	Buildable                                 *Buildable
	Dependency                                []*pb.BuildableLevelDependency
}

// BuildableIngredientInteraction :
type BuildableIngredientInteraction struct {
	ID                                int32  `json:"id" db:"id"`
	BuildableId                       int32  `json:"buildableId" db:"buildable_id"`
	IngredientId                      *int32 `json:"ingredientId" db:"ingredient_id"`
	RecipeId                          *int32 `json:"recipeId" db:"recipe_id"`
	Type                              int32  `json:"type" db:"type"`
	BuildableLevelToUnlockDisplayName int32  `json:"buildableLevelToUnlockDisplayName" db:"buildable_level_to_unlock_display_name"`
	IngredientPurchasePriceCurrency   int32  `json:"ingredientPurchasePriceCurrency" db:"ingredient_purchase_price_currency"`
	IngredientPurchasePriceValue      int32  `json:"ingredientPurchasePriceValue" db:"ingredient_purchase_price_value"`
}

type PlayerBulkSyncData struct {
	PlayerID          int32     `db:"player_id"`
	PBEncodedSyncData string    `db:"pb_encoded_sync_data"`
	CreatedAt         int64     `db:"created_at"`
	UpdatedAt         int64     `db:"updated_at"`
	DeletedAt         NullInt64 `db:"deleted_at"`
}

type BuildableLevelDependency struct {
	ID                      int32 `db:"id"`
	TargetBuildableID       int32 `db:"target_buildable_id"`
	TargetBuildableLevel    int32 `db:"target_buildable_level"`
	TargetBuildableMaxCount int32 `db:"target_buildable_max_count"`
	RequiredBuildableID     int32 `db:"required_buildable_id"`
	RequiredBuildableCount  int32 `db:"required_buildable_count"`
	RequiredMinimumLevel    int32 `db:"required_minimum_level"`
}

const (
	BUILDABLE_INGREDIENT_INTERACTION_SYNTHESIZE_TARGET  = 3
	BUILDABLE_INGREDIENT_INTERACTION_PRODUCIBLE         = 4
	BUILDABLE_INGREDIENT_INTERACTION_SYNTHESIZABLE      = 5
	BUILDABLE_INGREDIENT_INTERACTION_WILL_UNLOCK_RECIPE = 6
	BUILDABLE_INGREDIENT_INTERACTION_FREE_ORDER         = 7
)

const (
	BUILDABLE_TYPE_DEFENDER = 100
)

const (
	PLAYER_BUILDABLE_STATE_IDLE = 1
)

func GetAllBuildables(tx *sqlx.Tx) ([]*Buildable, error) {
	var tmp []*Buildable

	var query string
	var queryBaseStr string
	var args []interface{}
	var err error
	queryBaseStr = fmt.Sprintf("SELECT * FROM %s ORDER BY id ASC", TBL_BUILDABLE)
	query, args, err = sqlx.In(queryBaseStr)

	if err != nil {
		Logger.Error("Error occurred during invocation of `GetAllBuildables`", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `GetAllBuildables`", zap.Error(err))
		return nil, err
	}

	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return tmp, nil
}

func GetAllBuildableLevelBinding(tx *sqlx.Tx) ([]*pb.BuildableLevelBinding, error) {
	var tmp []*BuildableLevelBinding

	query, args, err := sq.Select("*").
		From(TBL_BUILDABLE_LEVEL_BINDING).
		OrderBy("id ASC").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	buildableIds := make([]int32, len(tmp))
	for i, binding := range tmp {
		buildableIds[i] = binding.BuildableID
	}
	buildableMap, err := GetBuildableByIds(tx, buildableIds)
	if err != nil {
		return nil, err
	}
	err = getDependencies(tx, tmp)
	if err != nil {
		return nil, err
	}

	pbList := make([]*pb.BuildableLevelBinding, len(tmp))
	for i, binding := range tmp {
		binding.Buildable = buildableMap[binding.BuildableID]
		pbList[i] = binding.ToProto()
	}
	return pbList, nil
}

func GetAllBuildableIngredientInteractionListNonPb(tx *sqlx.Tx) ([]*BuildableIngredientInteraction, error) {
	var tmp []*BuildableIngredientInteraction

	query, args, err := sq.Select("*").
		From(TBL_BUILDABLE_INGREDIENT_INTERACTION).
		OrderBy("id ASC").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return tmp, nil
}

func GetAllBuildableIngredientInteractionList(tx *sqlx.Tx) ([]*pb.BuildableIngredientInteraction, error) {
	var tmp []*BuildableIngredientInteraction

	query, args, err := sq.Select("*").
		From(TBL_BUILDABLE_INGREDIENT_INTERACTION).
		OrderBy("id ASC").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	pbList := make([]*pb.BuildableIngredientInteraction, len(tmp))
	for i, v := range tmp {
		pbList[i] = v.ToProto()
	}
	return pbList, nil
}

func GetAllBuildableIngredientInteraction(tx *sqlx.Tx) ([]*BuildableIngredientInteraction, error) {
	var tmp []*BuildableIngredientInteraction

	query, args, err := sq.Select("*").
		From(TBL_BUILDABLE_INGREDIENT_INTERACTION).
		OrderBy("id ASC").
		ToSql()

	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	return tmp, nil
}

func GetBuildableByIds(tx *sqlx.Tx, ids []int32) (map[int32]*Buildable, error) {
	var tmp []*Buildable
	query, args, err := sqlx.In("SELECT * FROM buildable WHERE id IN (?)", ids)
	if err != nil {
		return nil, err
	}
	err = tx.Select(&tmp, query, args...)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	resMap := make(map[int32]*Buildable, len(tmp))
	for _, buildable := range tmp {
		resMap[buildable.ID] = buildable
	}
	return resMap, nil
}

func getDependencies(tx *sqlx.Tx, p []*BuildableLevelBinding) error {
	var tmp []*BuildableLevelDependency

	query, args, err := sq.Select("*").
		From(TBL_BUILDABLE_LEVEL_DEPENDENCY).
		OrderBy("id ASC").
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
			if item.TargetBuildableID == binding.BuildableID && item.TargetBuildableLevel == binding.Level {
				binding.Dependency = append(binding.Dependency, item.toProto())
			}
		}
	}

	return nil
}

func (p *Buildable) ToProto() *pb.Buildable {
	return &pb.Buildable{
		Id:             p.ID,
		Type:           p.Type,
		DiscreteWidth:  p.DiscreteWidth,
		DiscreteHeight: p.DiscreteHeight,
		DisplayName:    p.DisplayName,
		AutoCollect:    p.AutoCollect,
	}
}

func (p *BuildableIngredientInteraction) ToProto() *pb.BuildableIngredientInteraction {
	toRetVal := pb.BuildableIngredientInteraction{
		Id:                                p.ID,
		BuildableId:                       p.BuildableId,
		Type:                              p.Type,
		BuildableLevelToUnlockDisplayName: p.BuildableLevelToUnlockDisplayName,
		IngredientPurchasePriceCurrency:   p.IngredientPurchasePriceCurrency,
		IngredientPurchasePriceValue:      p.IngredientPurchasePriceValue,
	}
	if nil != p.IngredientId {
		toRetVal.IngredientId = *p.IngredientId
	}
	if nil != p.RecipeId {
		toRetVal.RecipeId = *p.RecipeId
	}
	return &toRetVal
}

func (p *BuildableLevelBinding) ToProto() *pb.BuildableLevelBinding {
	binding := &pb.BuildableLevelBinding{
		Id:                              p.ID,
		Buildable:                       p.Buildable.ToProto(),
		Level:                           p.Level,
		BuildingOrUpgradingDuration:     p.BuildingOrUpgradingDuration,
		BuildingOrUpgradingRequiredGold: p.BuildingOrUpgradingRequiredGold,
		BuildingOrUpgradingRequiredResidentsCount: p.BuildingOrUpgradingRequiredResidentsCount,
		BaseGoldProductionRate:                    p.BaseGoldProductionRate,
		BaseFoodProductionRate:                    p.BaseFoodProductionRate,
		BaseRiflemanProductionRequiredGold:        p.BaseRiflemanProductionRequiredGold,
		BaseRiflemanProductionDuration:            p.BaseRiflemanProductionDuration,
		Dependency:                                p.Dependency,
		GoldLimitAddition:                         p.GoldLimitAddition,
		BaseHp:                                    p.BaseHp,
		BaseDamage:                                p.BaseDamage,
	}
	return binding
}

func (p BuildableLevelDependency) toProto() *pb.BuildableLevelDependency {
	return &pb.BuildableLevelDependency{
		TargetBuildableMaxCount: p.TargetBuildableMaxCount,
		RequiredBuildableId:     p.RequiredBuildableID,
		RequiredBuildableCount:  p.RequiredBuildableCount,
		RequiredMinimumLevel:    p.RequiredMinimumLevel,
	}
}

func (p *Buildable) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "buildable", []string{"id", "type",
		"discrete_width", "discrete_height", "display_name", "auto_collect"},
		[]interface{}{p.ID, p.Type, p.DiscreteWidth, p.DiscreteHeight, p.DisplayName, p.AutoCollect})
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

func (p *BuildableLevelBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_BUILDABLE_LEVEL_BINDING, []string{"id",
		"buildable_id",
		"level",
		"building_or_upgrading_duration",
		"building_or_upgrading_required_gold",
		"building_or_upgrading_required_residents_count",
		"base_gold_production_rate",
		"base_food_production_rate",
		"base_rifleman_production_required_gold",
		"base_rifleman_production_duration",
		"gold_limit_addition",
	},
		[]interface{}{p.ID,
			p.BuildableID,
			p.Level,
			p.BuildingOrUpgradingDuration,
			p.BuildingOrUpgradingRequiredGold,
			p.BuildingOrUpgradingRequiredResidentsCount,
			p.BaseGoldProductionRate,
			p.BaseFoodProductionRate,
			p.BaseRiflemanProductionRequiredGold,
			p.BaseRiflemanProductionDuration,
			p.GoldLimitAddition,
		})
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

func (p *BuildableIngredientInteraction) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, TBL_BUILDABLE_INGREDIENT_INTERACTION, []string{"id",
		"buildable_id",
		"ingredient_id",
		"recipe_id",
		"type",
		"buildable_level_to_unlock_display_name",
		"ingredient_purchase_price_currency",
		"ingredient_purchase_price_value",
	},
		[]interface{}{p.ID,
			p.BuildableId,
			p.IngredientId,
			p.RecipeId,
			p.Type,
			p.BuildableLevelToUnlockDisplayName,
			p.IngredientPurchasePriceCurrency,
			p.IngredientPurchasePriceValue,
		})
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

func (p *PlayerBulkSyncData) Insert(tx *sqlx.Tx) error {
	_, err := txInsert(tx, TBL_PLAYER_BULK_SYNC_DATA, []string{"player_id", "pb_encoded_sync_data",
		"created_at", "updated_at"},
		[]interface{}{p.PlayerID, p.PBEncodedSyncData, p.CreatedAt, p.UpdatedAt})
	if err != nil {
		return err
	}
	return nil
}

func InsertPlayerSyncData(tx *sqlx.Tx, playerId int32, syncData string) error {
	now := utils.UnixtimeMilli()
	_, err := txInsert(tx, TBL_PLAYER_BULK_SYNC_DATA, []string{"player_id", "pb_encoded_sync_data",
		"created_at", "updated_at"},
		[]interface{}{playerId, syncData, now, now})
	if err != nil {
		return err
	}
	return nil
}

func (p *BuildableLevelDependency) Insert(tx *sqlx.Tx) error {
	_, err := txInsert(tx, TBL_BUILDABLE_LEVEL_DEPENDENCY, []string{"id", "target_buildable_id",
		"target_buildable_level", "target_buildable_max_count", "required_buildable_id",
		"required_buildable_count", "required_minimum_level"},
		[]interface{}{p.ID, p.TargetBuildableID, p.TargetBuildableLevel, p.TargetBuildableMaxCount,
			p.RequiredBuildableID, p.RequiredBuildableCount, p.RequiredMinimumLevel})
	if err != nil {
		return err
	}
	return nil
}

func PlayerSyncData(tx *sqlx.Tx, playerId int32, data string, updatedAt int64) (bool, error) {
	query, args, err := sq.Update(TBL_PLAYER_BULK_SYNC_DATA).
		Set("pb_encoded_sync_data", data).
		Set("updated_at", updatedAt).
		Where(sq.And{sq.Eq{"player_id": playerId}, sq.LtOrEq{"updated_at": updatedAt}}).
		ToSql()

	if err != nil {
		return false, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rowsAffected >= 1, nil
}

func GetPlayerBulkSyncDataByID(tx *sqlx.Tx, playerID int32) (*PlayerBulkSyncData, error) {
	var tmp PlayerBulkSyncData
	err := txGetObj(tx, TBL_PLAYER_BULK_SYNC_DATA, sq.Eq{"player_id": playerID}, &tmp)
	if err != nil {
		return nil, err
	}
	return &tmp, nil
}

func GetPBEncodedSyncDataByPlayerID(tx *sqlx.Tx, playerID int32) (*pb.SyncDataStruct, error) {
	playerSyncData, err := GetPlayerBulkSyncDataByID(tx, playerID)
	if err != nil {
		return nil, err
	}
	result := &pb.SyncDataStruct{}
	decoded, _ := base64.StdEncoding.DecodeString(playerSyncData.PBEncodedSyncData)
	_ = proto.Unmarshal(decoded, result)
	return result, nil
}

func ComposePlayerBuildableBindingMapByPlayerId(tx *sqlx.Tx, playerID int32) (map[int32]*pb.PlayerBuildableBinding, error) {
	pbSyncData, err := GetPBEncodedSyncDataByPlayerID(tx, playerID)
	if err != nil {
		return nil, err
	}
	resultMap := make(map[int32]*pb.PlayerBuildableBinding)
	for _, binding := range pbSyncData.PlayerBuildableBindingList {
		resultMap[binding.Id] = binding
	}
	return resultMap, nil
}

func ComposePlayerMaxBuildableLevelMapByPlayerId(tx *sqlx.Tx, playerID int32) (map[int32]int32, error) {
	pbSyncData, err := GetPBEncodedSyncDataByPlayerID(tx, playerID)
	if err != nil {
		return nil, err
	}
	resultMap := make(map[int32]int32)
	for _, binding := range pbSyncData.PlayerBuildableBindingList {
		maxLevel, ok := resultMap[binding.Buildable.Id]
		if ok && maxLevel < binding.CurrentLevel {
			resultMap[binding.Buildable.Id] = binding.CurrentLevel
		} else if !ok {
			resultMap[binding.Buildable.Id] = binding.CurrentLevel
		}
	}
	return resultMap, nil
}

func ComposePlayerMaxBuildableLevelMap(syncData *pb.SyncDataStruct) map[int32]int32 {
	resultMap := make(map[int32]int32)
	for _, binding := range syncData.PlayerBuildableBindingList {
		maxLevel, ok := resultMap[binding.Buildable.Id]
		if ok && maxLevel < binding.CurrentLevel {
			resultMap[binding.Buildable.Id] = binding.CurrentLevel
		} else if !ok {
			resultMap[binding.Buildable.Id] = binding.CurrentLevel
		}
	}
	return resultMap
}

func ComposeFreeOrderInteractionMap(tx *sqlx.Tx) (map[int32][]*BuildableIngredientInteraction, error) {
	var interactionList []*BuildableIngredientInteraction
	err := getList(tx, TBL_BUILDABLE_INGREDIENT_INTERACTION, sq.Eq{"type": BUILDABLE_INGREDIENT_INTERACTION_FREE_ORDER}, &interactionList)
	if err != nil {
		return nil, err
	}

	resMap := make(map[int32][]*BuildableIngredientInteraction)

	for _, interaction := range interactionList {
		_, ok := resMap[*interaction.IngredientId]
		if !ok {
			resMap[*interaction.IngredientId] = make([]*BuildableIngredientInteraction, 0)
		}
		resMap[*interaction.IngredientId] = append(resMap[*interaction.IngredientId], interaction)
	}

	return resMap, nil
}
