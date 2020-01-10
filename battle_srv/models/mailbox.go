package models

import (
	"github.com/jmoiron/sqlx"

	sq "github.com/Masterminds/squirrel"
)

type Mailbox struct {
	Id        int32     `json:"id" db:"id"`
	PlayerId  int32     `json:"playerId" db:"player_id"`
	ReadState int32     `json:"readState" db:"read_state"`
	Content   string    `json:"content" db:"content"`
	Version   int32     `json:"version" db:"version"`
	CreatedAt int64     `json:"-" db:"created_at"`
	DeletedAt NullInt64 `json:"-" db:"deleted_at"`
	UpdatedAt int64     `json:"-" db:"updated_at"`
}

const (
	MAIL_UNREAD = 0
	MAIL_READ   = 1
)

func (p *Mailbox) Insert(tx *sqlx.Tx) error {
	query, args, err := sq.Insert(TBL_MAILBOX).Columns("player_id", "created_at", "updated_at", "read_state", "content", "version").Values(p.PlayerId, p.CreatedAt, p.UpdatedAt, p.ReadState, p.Content, p.Version).ToSql()
	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	return err
}

func QueryMailboxListByPlayerId(tx *sqlx.Tx, playerId int32) ([]*Mailbox, error) {
	var p []*Mailbox
	var err error
	if tx == nil {
		err = getList(nil, TBL_MAILBOX, sq.Eq{"player_id": playerId, "deleted_at": nil}, &p)
	} else {
		err = getList(tx, TBL_MAILBOX, sq.Eq{"player_id": playerId, "deleted_at": nil}, &p)
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}
