package scheduler

import (
	. "server/common"
	"server/models"

	"go.uber.org/zap"
)

func HandleExpiredPlayerLoginToken() {
	Logger.Debug("HandleExpiredPlayerLoginToken start")
	err := models.CleanExpiredPlayerLoginToken()
	if err != nil {
		Logger.Debug("HandleExpiredPlayerLoginToken", zap.Error(err))
	}
}
