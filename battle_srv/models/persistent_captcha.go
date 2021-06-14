package models

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
)

type PersistentCaptcha struct {
	Authkey                      string     `json:"authkey" db:"authkey"`
	Value                    string     `json:"value" db:"value"`
	CreatedAt                 int64      `json:"created_at" db:"created_at"`
	ExpiresAt                int64  `json:"expires_at" db:"expires_at"`
}

func (p *PersistentCaptcha) Insert(tx *sqlx.Tx) error {
	upsertQBaseStr := fmt.Sprintf("INSERT INTO %s (authkey, value, created_at, expires_at) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE value=?, expires_at=?", TBL_PERSISTENT_CAPTCHA)
	upsertQ, localErr := tx.Preparex(upsertQBaseStr)
	if localErr != nil {
		return localErr
	}
	upsertedResult := upsertQ.MustExec(p.Authkey, p.Value, p.CreatedAt, p.ExpiresAt, p.Value, p.ExpiresAt)

	_, err := upsertedResult.RowsAffected()
  return err
}

func GetPersistentCaptchaByKey(tx *sqlx.Tx, key string, value string, nowMillis int64) (*PersistentCaptcha, error) {
  queryBaseStr := fmt.Sprintf("SELECT * FROM %s WHERE authkey=? AND value=? AND expires_at>=? LIMIT 1", TBL_PERSISTENT_CAPTCHA)
	query, args, err := sqlx.In(queryBaseStr, key, value, nowMillis)

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
