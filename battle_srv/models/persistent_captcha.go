package models

import (
	"github.com/jmoiron/sqlx"
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
