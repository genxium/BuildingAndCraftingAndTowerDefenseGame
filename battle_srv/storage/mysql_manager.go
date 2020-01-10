package storage

import (
	. "server/common"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

var (
	MySQLManagerIns *sqlx.DB
)

func initMySQL() {
	var err error
	MySQLManagerIns, err = sqlx.Connect("mysql", Conf.MySQL.DSN)
	ErrFatal(err)
	err = MySQLManagerIns.Ping()
	ErrFatal(err)
	Logger.Info("MySQLManagerIns", zap.Any("mysql", MySQLManagerIns))
}
