package env_tools

import (
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	"server/models"
	"server/storage"
)

func MergeTestPlayerAccounts() {
	fp := Conf.General.TestEnvSQLitePath
	Logger.Info(`from sqlite merge into MySQL`, zap.String("fp", fp))
	db, err := sqlx.Connect("sqlite3", fp)
	ErrFatal(err)
	defer db.Close()
	maybeCreateNewPlayer(db)
}

type dbTestPlayer struct {
	Name                  string `db:"name"`
	MagicPhoneCountryCode string `db:"magic_phone_country_code"`
	MagicPhoneNum         string `db:"magic_phone_num"`
}

func maybeCreateNewPlayer(db *sqlx.DB) {
	var ls []*dbTestPlayer
	err := db.Select(&ls, "SELECT name, magic_phone_country_code, magic_phone_num FROM test_player")
	ErrFatal(err)
	names := make([]string, len(ls), len(ls))
	for i, v := range ls {
		names[i] = v.Name
	}
	Logger.Info(`maybeCreateNewPlayer`, zap.Any("names", names))
	sql := "SELECT name FROM `player` WHERE name in (?)"
	query, args, err := sqlx.In(sql, names)
	ErrFatal(err)
	query = storage.MySQLManagerIns.Rebind(query)
	// existNames := make([]string, len(ls), len(ls))
	var existPlayers []*models.Player
	err = storage.MySQLManagerIns.Select(&existPlayers, query, args...)
	ErrFatal(err)

	for _, testPlayer := range ls {
		var flag bool
		for _, v := range existPlayers {
			if testPlayer.Name == v.Name {
				// 已有数据，合并处理
				flag = true
				break
			}
		}
		if !flag {
			// 找不到，新增
			Logger.Debug("create", zap.Any("testPlayer", testPlayer))
			err := createNewPlayer(testPlayer)
			ErrFatal(err)
		}
	}
}

func createNewPlayer(p *dbTestPlayer) error {
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	now := utils.UnixtimeMilli()
	player := models.Player{
		CreatedAt: now,
		UpdatedAt: now,
		Name:      p.Name,
		Diamond:   int32(Constants.InitialDiamondPerPlayer),
	}
	err := player.Insert(tx)
	if err != nil {
		return err
	}
	playerAuthBinding := models.PlayerAuthBinding{
		CreatedAt: now,
		UpdatedAt: now,
		Channel:   int32(Constants.AuthChannel.Sms),
		ExtAuthID: p.MagicPhoneCountryCode + p.MagicPhoneNum,
		PlayerID:  player.ID,
	}
	err = playerAuthBinding.Insert(tx)
	if err != nil {
		return err
	}
	syncData := models.PlayerBulkSyncData{
		PlayerID:          player.ID,
		CreatedAt:         now,
		UpdatedAt:         now,
		PBEncodedSyncData: "",
	}
	err = syncData.Insert(tx)
	if err != nil {
		Logger.Error("createNewPlayer from test player", zap.Any("forTestPlayer", p), zap.NamedError("createNewPlayerErr", err))
		return err
	}
	err = models.AllocateMissionForPlayerByBatchID(tx, player.ID, 1)
	if err != nil {
		Logger.Error("createNewPlayer from test player", zap.Any("forTestPlayer", p), zap.NamedError("createNewPlayerErr", err))
		return err
	}
	err = models.AllocateAchievementForPlayerByBatchID(tx, player.ID, 0, nil, nil, nil, nil)
	if err != nil {
		Logger.Error("createNewPlayer from test player", zap.Any("forTestPlayer", p), zap.NamedError("createNewPlayerErr", err))
		return err
	}
	err = models.AddPlayerUnknownRecipe(tx, player.ID)
	if err != nil {
		Logger.Error("createNewPlayer from test player", zap.Any("forTestPlayer", p), zap.NamedError("createNewPlayerErr", err))
		return err
	}
	err = models.AddPlayerStageBinding(tx, player.ID, 1, models.STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE)
	if err != nil {
		Logger.Error("createNewPlayer from test player", zap.Any("forTestPlayer", p), zap.NamedError("createNewPlayerErr", err))
		return err
	}
	toInitIngredientIdList := []int32{}
	toInitIngredientCountList := []int32{}
	for idx, toInitIngredientId := range toInitIngredientIdList {
		increCount := toInitIngredientCountList[idx]
		_, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, player.ID)
		if nil != localErr {
			return err
		}
	}
	tx.Commit()
	return nil
}
