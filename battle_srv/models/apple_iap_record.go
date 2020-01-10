package models

import (
	"github.com/jmoiron/sqlx"
)

type AppleIapRecord struct {
	ProductIdentifier     string
	TransactionIdentifier string
	Quantity              int32
	CreatedAt             int64
}

func (p *AppleIapRecord) AddLegalCurrencyPaymentRecord(tx *sqlx.Tx, playerID int32) error {
	var purchasedDiamond int32 = 0
	var currencyCost int32 = 0
	var currencyType int32 = 0

	sku := GetSkuByName(p.ProductIdentifier)

	if sku == nil {
		return nil
	}

	for _, binding := range sku.Bindings {
		if binding.AddResourceType == DIAMOND {
			purchasedDiamond = binding.AddValue
			currencyCost = sku.LegalCurrencyCost
			currencyType = sku.LegalCurrencyType
		}
	}

	paymentRecord := &LegalCurrencyPaymentRecord{
		FromPlayerID:               playerID,
		ToPlayerID:                 playerID,
		Channel:                    PAYMENT_CHANNEL_APPLE_IAP,
		SkuID:                      p.ProductIdentifier,
		State:                      PAYMENT_RECORD_PAID,
		ExtTrxID:                   p.TransactionIdentifier,
		LegalCurrencyType:          currencyType,
		ProposedLegalCurrencyCost:  currencyCost,
		ProposedDiamondsToPurchase: purchasedDiamond,
		ActualLegalCurrencyCost:    currencyCost,
		ActualDiamondsPurchased:    purchasedDiamond,
		CreatedAt:                  p.CreatedAt,
	}

	err := paymentRecord.Insert(tx)
	if err != nil {
		return err
	}
	return nil
}
