package env_tools

import (
	"os"
	. "server/common"
	"server/models"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

func LoadPreConf() {
	Logger.Info(`Merging into MySQL from:`,
		zap.String("SQLiteFilePath", Conf.General.PreConfSQLitePath))
	db, err := sqlx.Connect("sqlite3", Conf.General.PreConfSQLitePath)
	ErrFatal(err)
	defer db.Close()
	loadPreConfToMysql(db)
}

func loadPreConfToMysql(db *sqlx.DB) {
	tbs := []string{"mission",
		"quest",
		"mission_reward_binding",
		"buildable",
		"buildable_level_binding",
		"buildable_level_dependency",
		"mission",
		"mission_reward_binding",
		"sku",
		"sku_binding",
		"ingredient",
		"recipe",
		"recipe_ingredient_binding",
		"buildable_ingredient_interaction",
		"stage_initial_state",
	}
	loadPreConfSqlite(db, tbs)
}

func loadPreConfSqlite(db *sqlx.DB, tbs []string) {
	tableNotToTruncate := make(map[string]bool)
	tableNotToTruncate["sku"] = true
	tableNotToTruncate["sku_binding"] = true

	for _, v := range tbs {
		if _, ok := tableNotToTruncate[v]; !ok {
			result, err := storage.MySQLManagerIns.Exec("truncate " + v)
			ErrFatal(err)
			Logger.Info("truncate", zap.Any("truncate "+v, result))
		}
		query, args, err := sq.Select("*").From(v).ToSql()
		if err != nil {
			Logger.Info("loadSql ToSql error", zap.Any("err", err))
		}
		rows, err := db.Queryx(query, args...)
		if err != nil {
			Logger.Info("loadSql query error", zap.Any("err", err))
		}
		createMysqlDataFromPreConf(rows, v)
	}
	combineSkuBinding()
}

func createMysqlDataFromPreConf(rows *sqlx.Rows, v string) {
	tx := storage.MySQLManagerIns.MustBegin()
	defer Logger.Info("load " + v + " success")
	defer tx.Rollback()
	switch v {
	case "mission":
		s := models.Mission{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "quest":
		s := models.Quest{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "mission_reward_binding":
		s := models.MissionRewardBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "buildable":
		s := models.Buildable{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "buildable_level_binding":
		s := models.BuildableLevelBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "buildable_level_dependency":
		s := models.BuildableLevelDependency{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "sku":
		s := models.Sku{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			models.PaymentSku[s.ID] = &s
		}
		break
	case "sku_binding":
		s := models.SkuBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			models.PaymentSkuBinding[s.ID] = &s
		}
		break
	case "ingredient":
		s := models.Ingredient{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "recipe":
		s := models.Recipe{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "recipe_ingredient_binding":
		s := models.RecipeIngredientBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "buildable_ingredient_interaction":
		s := models.BuildableIngredientInteraction{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	case "stage_initial_state":
		s := models.StageInitialState{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Warn(v+" load", zap.Any("Scan error", err))
				os.Exit(1)
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				os.Exit(1)
			}
		}
		break
	}

	err := tx.Commit()
	if err != nil {
		Logger.Warn(v+" load", zap.Any("tx.commit error", err))
		os.Exit(1)
	}
}

func LoadMailboxTranscript() {
	Logger.Info(`Merging into MySQL from:`,
		zap.String("SQLiteFilePath", Conf.General.MailboxTranscriptSqlitePath))
	db, err := sqlx.Connect("sqlite3", Conf.General.MailboxTranscriptSqlitePath)
	ErrFatal(err)
	defer db.Close()
	loadMailboxTranscript(db)
}

func loadMailboxTranscript(db *sqlx.DB) {
	tbs := []string{"mailbox_transcript_en_us"}
	for _, v := range tbs {
		result, err := storage.MySQLManagerIns.Exec("truncate " + v)
		ErrFatal(err)
		Logger.Info("truncate", zap.Any("truncate "+v, result))
		query, args, err := sq.Select("*").From(v).ToSql()
		if err != nil {
			Logger.Info("loadSql ToSql error", zap.Any("err", err))
		}
		rows, err := db.Queryx(query, args...)
		if err != nil {
			Logger.Info("loadSql query error", zap.Any("err", err))
		}

		// Respective insertions.
		tx := storage.MySQLManagerIns.MustBegin()
		defer Logger.Info("load " + v + " success")
		defer tx.Rollback()
		switch v {
		case "player_notification_transcript_us_english":
			s := models.MailboxTranscriptEnUs{}
			for rows.Next() {
				err := rows.StructScan(&s)
				if err != nil {
					Logger.Warn(v+" load", zap.Any("Scan error", err))
				}
				insertErr := s.Insert(tx)
				if insertErr != nil {
					Logger.Warn(v+" load", zap.Any("Insert error", insertErr))
				}
			}
		}
		err = tx.Commit()
		if err != nil {
			Logger.Warn(v+" load", zap.Any("tx.commit error", err))
		}
	}
}

func combineSkuBinding() {
	for _, binding := range models.PaymentSkuBinding {
		sku := models.PaymentSku[binding.SkuID]
		sku.Bindings = append(sku.Bindings, binding)
	}
	models.InitPaymentSkuByName(models.PaymentSku)
	Logger.Info("load sku", zap.Any("sku", models.PaymentSkuBinding))
}
