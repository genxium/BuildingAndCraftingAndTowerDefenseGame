package models

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PlayerAuthBinding struct {
	Channel           int32     `json:"channel" db:"channel"`
	CreatedAt         int64     `json:"created_at" db:"created_at"`
	DeletedAt         NullInt64 `json:"deleted_at" db:"deleted_at"`
	ExtAuthID         string    `json:"ext_auth_id" db:"ext_auth_id"`
	NewPlayerUpsynced string    `json:"new_player_upsynced" db:"new_player_upsynced"`
	PlayerID          int32     `json:"player_id" db:"player_id"`
	UpdatedAt         int64     `json:"updated_at" db:"updated_at"`
}

func (p *PlayerAuthBinding) Insert(tx *sqlx.Tx) error {
	_, err := txInsert(tx, "player_auth_binding", []string{"channel", "created_at", "ext_auth_id",
		"player_id", "updated_at"},
		[]interface{}{p.Channel, p.CreatedAt, p.ExtAuthID, p.PlayerID, p.UpdatedAt})
	return err
}

func GetPlayerAuthBinding(channel int32, extAuthID string, tx *sqlx.Tx) (*PlayerAuthBinding, error) {
	var p PlayerAuthBinding
	var err error
	if nil == tx {
		err = getObj("player_auth_binding",
			sq.Eq{"channel": channel, "ext_auth_id": extAuthID, "deleted_at": nil},
			&p)
	} else {
		err = txGetObj(tx, "player_auth_binding",
			sq.Eq{"channel": channel, "ext_auth_id": extAuthID, "deleted_at": nil},
			&p)
	}
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, err
}
