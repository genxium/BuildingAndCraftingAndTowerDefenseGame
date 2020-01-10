package models

import (
	"database/sql"
	. "server/common"
	"server/common/utils"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PlayerLogin struct {
	CreatedAt    int64      `json:"created_at" db:"created_at"`
	DeletedAt    NullInt64  `json:"deleted_at" db:"deleted_at"`
	DisplayName  NullString `json:"display_name" db:"display_name"`
	FromPublicIP NullString `json:"from_public_ip" db:"from_public_ip"`
	ID           int32      `json:"id" db:"id"`
	IntAuthToken string     `json:"int_auth_token" db:"int_auth_token"`
	PlayerID     int32      `json:"player_id" db:"player_id"`
	UpdatedAt    int64      `json:"updated_at" db:"updated_at"`
}

func (p *PlayerLogin) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player_login", []string{"created_at", "display_name",
		"from_public_ip", "int_auth_token", "player_id", "updated_at"},
		[]interface{}{p.CreatedAt, p.DisplayName, p.FromPublicIP, p.IntAuthToken,
			p.PlayerID, p.UpdatedAt})
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

func GetPlayerLoginByToken(token string) (*PlayerLogin, error) {
	var p PlayerLogin
	err := getObj("player_login",
		sq.Eq{"int_auth_token": token, "deleted_at": nil},
		&p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, nil
}

func GetPlayerLoginByPlayerId(tx *sqlx.Tx, playerId int32) (*PlayerLogin, error) {
	var p PlayerLogin
	err := txGetObj(tx, "player_login",
		sq.Eq{"player_id": playerId, "deleted_at": nil},
		&p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &p, nil
}

func GetPlayerIdByToken(token string) (int32, error) {
	var p PlayerLogin
	err := getFields("player_login", []string{"player_id"},
		sq.Eq{"int_auth_token": token, "deleted_at": nil},
		&p)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	return p.PlayerID, nil
}

func DelPlayerLoginByToken(tx *sqlx.Tx, token string) error {
	query, args, err := sq.Update("player_login").Set("deleted_at", utils.UnixtimeMilli()).
		Where(sq.Eq{"int_auth_token": token}).ToSql()
	if err != nil {
		return err
	}
	if tx == nil {
		_, err = storage.MySQLManagerIns.Exec(query, args...)
	} else {
		_, err = tx.Exec(query, args...)
	}
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}
	return nil
}

func EnsuredPlayerLoginByToken(id int32, token string) (bool, error) {
	return exist("player_login", sq.Eq{"int_auth_token": token, "deleted_at": nil, "player_id": id})
}

func EnsuredPlayerLoginById(tx *sqlx.Tx, id int32) (bool, error) {
	return txExist(tx, "player_login", sq.Eq{"player_id": id, "deleted_at": nil})
}

func CleanExpiredPlayerLoginToken() error {
	now := utils.UnixtimeMilli()
	max := now - int64(Constants.Player.IntAuthTokenTTLSeconds*1000)

	query, args, err := sq.Update("player_login").Set("deleted_at", now).
		Where(sq.LtOrEq{"created_at": max}).ToSql()
	if err != nil {
		return err
	}
	_, err = storage.MySQLManagerIns.Exec(query, args...)
	return err
}
