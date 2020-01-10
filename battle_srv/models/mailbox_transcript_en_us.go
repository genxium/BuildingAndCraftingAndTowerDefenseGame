package models

import (
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
)

type MailboxTranscriptEnUs struct {
	ID              int32  `json:"id" db:"id"`
	Version         int32  `json:"version" db:"version"`
	TranscriptKey   string `json:"transcriptKey" db:"transcript_key"`
	PayloadTemplate string `json:"payloadTemplate" db:"payload_template"`
}

func (p *MailboxTranscriptEnUs) Insert(tx *sqlx.Tx) error {
	query, args, err := sq.Insert(TBL_MAILBOX_TRANSCRIPT_EN_US).Columns("version", "transcript_type", "transcript_key", "payload_template").Values(p.Version, p.TranscriptKey, p.PayloadTemplate).ToSql()
	Logger.Debug("insert MailboxTranscriptEnUs", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	return err
}

func GetMailboxTranscriptEnUsByKey(transcriptKey string) (*MailboxTranscriptEnUs, error) {
	var tmp MailboxTranscriptEnUs
	query, args, err := sq.Select("*").From(TBL_MAILBOX_TRANSCRIPT_EN_US).Where(sq.Eq{"transcript_key": transcriptKey}).Limit(1).ToSql()
	Logger.Debug("GetMailboxTranscriptEnUs", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return nil, err
	}
	err = storage.MySQLManagerIns.Get(&tmp, query, args...)
	if tmp.ID == 0 {
		Logger.Warn("player_notification_transcript_us_english not exist key as " + transcriptKey)
		//返回的时空信息
		return &tmp, nil
	}
	if err != nil {
		return nil, err
	}
	return &tmp, nil
}
