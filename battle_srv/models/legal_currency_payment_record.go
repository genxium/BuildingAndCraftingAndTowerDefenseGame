package models

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	utils "server/common/utils"
	pb "server/pb_output"
)

var (
	PAYMENT_RECORD_CREATED                      int32 = 0
	PAYMENT_RECORD_PAID                         int32 = 1
	PAYMENT_RECORD_PAYMENT_CHANNEL_ACKNOWLEDGED int32 = 2
	PAYMENT_RECORD_PLAYER_ACKNOWLEDGED          int32 = 3
	PAYMENT_RECORD_CLAIMED_IN_UPSYNC            int32 = 4
)

var (
	PAYMENT_CHANNEL_APPLE_IAP int32 = 0
	PAYMENT_CHANNEL_WECHAT    int32 = 1
	PAYMENT_CHANNEL_ALIPAY    int32 = 2
)

var (
	PaymentSku        = make(map[int32]*Sku)
	PaymentSkuBinding = make(map[int32]*SkuBinding)
	appleSkuByName    = make(map[string]*Sku)
)

type LegalCurrencyPaymentRecord struct {
	ID                         int32  `json:"id" db:"id"`
	FromPlayerID               int32  `json:"-" db:"from_player_id"`
	ToPlayerID                 int32  `json:"-" db:"to_player_id"`
	Channel                    int32  `json:"channel" db:"channel"`
	SkuID                      string `json:"-" db:"sku_id"`
	State                      int32  `json:"-" db:"state"`
	ExtTrxID                   string `json:"extTrxId" db:"ext_trx_id"`
	PrepayID                   int32  `json:"-" db:"prepay_id"`
	LegalCurrencyType          int32  `json:"-" db:"legal_currency_type"`
	ProposedLegalCurrencyCost  int32  `json:"-" db:"proposed_legal_currency_cost"`
	ProposedDiamondsToPurchase int32  `json:"-" db:"proposed_diamonds_to_purchase"`
	ActualLegalCurrencyCost    int32  `json:"-" db:"actual_legal_currency_cost"`
	ActualDiamondsPurchased    int32  `json:"-" db:"actual_diamonds_purchased"`
	RawReceipt                 int32  `json:"-" db:"raw_receipt"`
	CreatedAt                  int64  `json:"-" db:"created_at"`
	UpdatedAt                  int64  `json:"-" db:"updated_at"`
	DeletedAt                  int64  `json:"-" db:"deleted_at"`
}

type Sku struct {
	ID                int32  `json:"id" db:"id"`
	Name              string `json:"name" db:"name"`
	Title             string `json:"title" db:"title"`
	LegalCurrencyType int32  `json:"legalCurrencyType" db:"legal_currency_type"`
	LegalCurrencyCost int32  `json:"legalCurrencyCost" db:"legal_currency_cost"`
	Description       string `json:"description" db:"description"`
	Channel           int32  `json:"channel" db:"channel"`
	Bindings          []*SkuBinding
}

type SkuBinding struct {
	ID              int32 `json:"-" db:"id"`
	SkuID           int32 `json:"skuId" db:"sku_id"`
	AddResourceType int32 `json:"addResourceType" db:"add_resource_type"`
	AddValue        int32 `json:"addValue" db:"add_value"`
}

func (p *LegalCurrencyPaymentRecord) Insert(tx *sqlx.Tx) error {
	now := utils.UnixtimeMilli()
	result, err := txInsert(tx, TBL_LEGAL_CURRENCY_PAYMENT_RECORD, []string{"id",
		"from_player_id",
		"to_player_id",
		"channel",
		"sku_id",
		"state",
		"ext_trx_id",
		"prepay_id",
		"proposed_legal_currency_cost",
		"proposed_diamonds_to_purchase",
		"actual_legal_currency_cost",
		"actual_diamonds_purchased",
		"raw_receipt",
		"created_at",
		"updated_at",
	},
		[]interface{}{p.ID,
			p.FromPlayerID,
			p.ToPlayerID,
			p.Channel,
			p.SkuID,
			p.State,
			p.ExtTrxID,
			p.PrepayID,
			p.ProposedLegalCurrencyCost,
			p.ProposedDiamondsToPurchase,
			p.ActualLegalCurrencyCost,
			p.ActualDiamondsPurchased,
			p.RawReceipt,
			p.CreatedAt,
			now,
		})
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

func UpdateLegalCurrencyPaymentRecordState(tx *sqlx.Tx, legalCurrencyPaymentRecordID int32, state int32) error {
	now := utils.UnixtimeMilli()
	query, args, err := sq.Update(TBL_LEGAL_CURRENCY_PAYMENT_RECORD).
		Set("state", state).
		Set("updated_at", now).
		Where(sq.Eq{"id": legalCurrencyPaymentRecordID}).
		ToSql()

	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	if err != nil {
		return err
	}
	return nil
}

func GetLegalCurrencyPaymentRecordByState(tx *sqlx.Tx, playerID int32, state int32) ([]*LegalCurrencyPaymentRecord, error) {
	query, args, err := sq.Select("*").
		From(TBL_LEGAL_CURRENCY_PAYMENT_RECORD).
		Where(sq.And{sq.Eq{"to_player_id": playerID}, sq.Eq{"state": state}}).
		OrderBy("id asc").
		ToSql()

	if err != nil {
		return nil, err
	}

	var records []*LegalCurrencyPaymentRecord

	err = tx.Select(&records, query, args...)
	if err != nil {
		return nil, err
	}

	return records, nil
}

func (p *LegalCurrencyPaymentRecord) ToProto() *pb.LegalCurrencyPaymentRecord {
	return &pb.LegalCurrencyPaymentRecord{
		Id:       p.ID,
		ExtTrxId: p.ExtTrxID,
		Channel:  p.Channel,
	}
}

func InitPaymentSkuByName(arr map[int32]*Sku) {
	for _, sku := range arr {
		if sku.Channel != 0 {
			continue
		}
		appleSkuByName[sku.Name] = sku
	}
}

func GetSkuByName(name string) *Sku {
	return appleSkuByName[name]
}
