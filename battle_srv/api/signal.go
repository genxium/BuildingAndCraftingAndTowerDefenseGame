package api

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

const RET = "ret"
const PLAYER_ID = "playerId"
const STAGE_ID = "stage"
const TOKEN = "token"

// check error
func CErr(c *gin.Context, err error) {
	if err != nil {
		c.Error(err)
	}
}

func HandleRet() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		ret := c.GetInt("ret")
		if 0 == ret {
			// This is a dirty fix. -- YFLu
			ret = int(c.GetInt64("ret"))
		}
		// Logger.Debug("HandleRet", zap.Any("keys", c.Keys))
		// Logger.Debug("ret", ret)
		if ret != 0 {
			c.JSON(http.StatusOK, gin.H{"ret": ret})
		}
	}
}
