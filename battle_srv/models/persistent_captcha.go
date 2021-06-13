package models

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
)

type PersistentCaptcha struct {
	Key                      string     `json:"key" db:"key"`
	Value                      string     `json:"value" db:"value"`
	CreatedAt                 int64      `json:"created_at" db:"created_at"`
	ExpiresAt                 NullInt64  `json:"expires_at" db:"expires_at"`
}

func (p *PersistentCaptcha) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "captcha", []string{"key", "value", "diamond", "created_at", "expires_at"},
		[]interface{}{p.Key, p.Value, p.CreatedAt, p.ExpiresAt})
	if err != nil {
		return err
	}
	_, err = result.LastInsertId()
	if nil != err {
		return err
	}
	return nil
}

func GetPersistentCaptchaByKey(tx *sqlx.Tx, key string, nowMillis int64) (*PersistentCaptcha, error) {
  queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE key=? AND expires_at>=? LIMIT 1", TBL_PERSISTENT_CAPTCHA)
	query, args, err := sqlx.In(queryBaseStr, key, nowMillis)

	if err != nil {
		Logger.Error("Error occurred during invocation of `GetPersistentCaptchaByKey`#1", zap.Error(err))
		return nil, err
	}
	query = tx.Rebind(query)
	if err != nil {
		Logger.Error("Error occurred during invocation of `GetPersistentCaptchaByKey`#2", zap.Error(err))
		return nil, err
	}

	resultList := make([]*PersistentCaptcha, 0)
	err = tx.Select(&resultList, query, args...)
	if err != nil {
		Logger.Error("Error occurred during invocation of `GetPersistentCaptchaByKey`#3", zap.Error(err))
		return nil, err
	}

	if 0 >= len(resultList) {
		Logger.Error("Error occurred during invocation of `GetPersistentCaptchaByKey`#4", zap.Error(err))
		return nil, err
	}

	return resultList[0], nil
}
