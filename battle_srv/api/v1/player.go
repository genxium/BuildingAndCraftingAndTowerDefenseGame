package v1

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-redis/redis"
	"github.com/golang/protobuf/proto"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
	"server/api"
	. "server/common"
	"server/common/utils"
	"server/game_center"
	googleAuthIDTokenVerifier "server/google_auth_verifier"
	"server/iap"
	"server/inet"
	"server/models"
	pb "server/pb_output"
	"server/storage"
	wechatVerifier "server/wechat"
	"strconv"
	"time"
)

var Player = playerController{}

type playerController struct {
}

type ExtAuthLoginReq interface {
	extAuthId() string
}

/* SmsCaptchaReq [begins]. */
type SmsCaptchaReq struct {
	Num         string `json:"phoneNum,omitempty" form:"phoneNum"`
	CountryCode string `json:"phoneCountryCode,omitempty" form:"phoneCountryCode"`
	Captcha     string `json:"smsLoginCaptcha,omitempty" form:"smsLoginCaptcha"`
}

func (req *SmsCaptchaReq) extAuthId() string {
	return req.CountryCode + req.Num
}

func (req *SmsCaptchaReq) redisKey() string {
	return "/cuisine/sms/captcha/" + req.extAuthId()
}

/* SmsCaptchaReq [ends]. */

/* GoogleAuthLoginReq [begins]. */
type GoogleAuthLoginReq struct {
	GgAuthId      string `json:"ggAuthId,omitempty" form:"ggAuthId"`
	GgAuthIdToken string `json:"ggAuthIdToken,omitempty" form:"ggAuthIdToken"`
}

func (req *GoogleAuthLoginReq) extAuthId() string {
	return req.GgAuthId
}

/* GoogleAuthLoginReq [ends]. */

/* GameCenterReq [begins]. */
type GameCenterReq struct {
	PlayerId            string `json:"playerId,omitempty" form:"playerId"`
	PublicKeyUrl        string `json:"publicKeyUrl,omitempty" form:"publicKeyUrl"`
	SignatureB64Encoded string `json:"signatureB64Encoded,omitempty" form:"signatureB64Encoded"`
	SaltB64Encoded      string `json:"saltB64Encoded" form:"saltB64Encoded"`
	Timestamp           string `json:"timestamp" form:"timestamp"`
}

func (req *GameCenterReq) extAuthId() string {
	return req.PlayerId
}

/* GameCenterReq [ends]. */

/* AnonymousLoginReq [begins] */
type AnonymousLoginReq struct {
	DeviceUuid string `json:"deviceUuid" form:"deviceUuid"`
}

func (req *AnonymousLoginReq) extAuthId() string {
	return req.DeviceUuid
}

/* AnonymousLoginReq [ends] */

type intAuthTokenReq struct {
	Token string `form:"intAuthToken,omitempty"`
}

/* PlayerBuildableBindingIngredientListQueryReq [begins]. */
type PlayerBuildableBindingIngredientListQueryReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
	PtrAutoCollect                    *int32 `form:"autoCollect"`
}

func (p *playerController) PlayerBuildableBindingIngredientListQuery(c *gin.Context) {
	var req PlayerBuildableBindingIngredientListQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	if nil != err {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrAutoCollect {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrTargetPlayerBuildableBindingId {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, req.PtrAutoCollect)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientList, err := models.QueryAllIngredientList(tx, *req.PtrTargetPlayerBuildableBindingId)
	api.CErr(c, err)

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		Logger.Info("Error querying the new `knapsackRecordList`", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	/*trx finish*/
	resp := struct {
		Ret                    int64                        `json:"ret"`
		ReqSeqNum              int64                        `json:"reqSeqNum"`
		IngredientList         []*models.Ingredient         `json:"ingredientList"`
		IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
		KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
	}{Constants.RetCode.Ok, req.ReqSeqNum, ingredientList, ingredientProgressList, knapsackRecordList}

	c.JSON(http.StatusOK, resp)
}

/* PlayerBuildableBindingIngredientListQueryReq [ends]. */

/* PlayerBuildableBindingIngredientCollectReq [begins]. */
type PlayerBuildableBindingIngredientCollectReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
}

func (p *playerController) PlayerBuildableBindingIngredientCollect(c *gin.Context) {
	var req PlayerIngredientProduceReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	if nil != err {
		Logger.Warn("Invalid request params", zap.Any("req", req))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrTargetPlayerBuildableBindingId {
		Logger.Warn("Invalid request params", zap.Any("req", req))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	autoCollect := int32(0) // Temporarily hardcoded. -- YFLu
	ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, &autoCollect)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientProgressList, err = models.CollectAppropriateIngredients(tx, playerId, req.PtrTargetPlayerBuildableBindingId)

	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	playerRecipe, err := models.GetPlayerRecipe(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	// Logger.Info("PlayerBuildableBindingIngredientCollectReq returning", zap.Any("playerId", playerId), zap.Any("targetPlayerBuildableBindingId", *req.PtrTargetPlayerBuildableBindingId), zap.Any("ingredientProgressList", ingredientProgressList), zap.Any("knapsackRecordList", knapsackRecordList))
	/*trx finish*/
	resp := struct {
		Ret                    int64                        `json:"ret"`
		ReqSeqNum              int64                        `json:"reqSeqNum"`
		IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
		KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
		RecipeList             []*models.PlayerRecipeResp   `json:"playerRecipeList"`
	}{Constants.RetCode.Ok, req.ReqSeqNum, ingredientProgressList, knapsackRecordList, playerRecipe}

	c.JSON(http.StatusOK, resp)
}

/* PlayerBuildableBindingIngredientCollectReq [ends]. */

/* PlayerIngredientProduceReq [begins]. */
type PlayerIngredientProduceReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	IngredientId                      int32  `form:"ingredientId"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
	PtrAutoCollect                    *int32 `form:"autoCollect"`
}

func (p *playerController) PlayerIngredientProduce(c *gin.Context) {
	var req PlayerIngredientProduceReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	if nil != err {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrAutoCollect {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	if nil == req.PtrTargetPlayerBuildableBindingId {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	incompleteIngredientProgressCount := 0
	var millisToStartForImmediateInsertion int32 = 0
	var occupiedResidenceCount int32 = 0
	var toCalculateProgressList []*models.IngredientProgress
	for _, autoCollect := range []int{1, 0} {
		useManualCollectMark := int32(autoCollect)
		pUseManualCollectMark := &useManualCollectMark
		ingredientProgressList, pMillisToStartForImmediateInsertion, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, pUseManualCollectMark)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		for _, progress := range ingredientProgressList {
			if *progress.PtrState == models.INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED {
				incompleteIngredientProgressCount++
			}
		}

		if pMillisToStartForImmediateInsertion != nil && (*pMillisToStartForImmediateInsertion) != 0 {
			millisToStartForImmediateInsertion = *pMillisToStartForImmediateInsertion
		}
		toCalculateProgressList = ingredientProgressList
	}

	occupiedResidence, err := models.CalculateOccupiedResidenceCountByIngredientProgressList(tx, playerId, toCalculateProgressList)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	occupiedResidenceCount += occupiedResidence

	knapsackResidenceCount, err := models.CalculateKnapsackOccupiedResidenceCount(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	occupiedResidenceCount += knapsackResidenceCount
	allowedResidenceCount, err := models.CalculateAllowedResidenceCount(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	Logger.Info("ResidenceCounts: ", zap.Any("occupied", occupiedResidenceCount), zap.Any("allowed", allowedResidenceCount))

	targetIngredient, err := models.QueryOneIngredient(tx, req.IngredientId, false)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	if targetIngredient.Category == models.INGREDIENT_CATEGORY_TECH {
		targetIngredientList, err := models.QueryTargetIngredientProgressByPlayerId(tx, playerId, targetIngredient.ID)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		if len(targetIngredientList) > 0 {
			c.Set(api.RET, Constants.RetCode.ResearchInProgress)
			return
		}

		knapsackList, err := models.GetAllKnapsack(tx, playerId)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		existIngredient := false
		for _, knapsack := range knapsackList {
			if knapsack.IngredientId == targetIngredient.ID {
				if knapsack.CurrentCount > 0 {
					existIngredient = true
					break
				} else {
					break
				}
			}
		}

		if existIngredient {
			c.Set(api.RET, Constants.RetCode.AlreadyObtained)
			return
		}
	}

	if occupiedResidenceCount+targetIngredient.ResidenceOccupation > allowedResidenceCount {
		c.Set(api.RET, Constants.RetCode.PopulationLimitExceeded)
		return
	}

	if models.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING <= incompleteIngredientProgressCount {
		c.Set(api.RET, Constants.RetCode.IngredientProgressMaxPerPlayerBuildableBindingExceeded)
		return
	}

	productionDurationMillis := targetIngredient.BaseProductionDurationMillis
	_, err = models.InsertIngredientProgressFromPlayerBuildableBinding(tx, playerId, req.IngredientId, req.PtrTargetPlayerBuildableBindingId, productionDurationMillis, millisToStartForImmediateInsertion, req.PtrAutoCollect)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, req.PtrAutoCollect)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	/*trx finish*/
	resp := struct {
		Ret                    int64                        `json:"ret"`
		ReqSeqNum              int64                        `json:"reqSeqNum"`
		IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
	}{Constants.RetCode.Ok, req.ReqSeqNum, ingredientProgressList}

	c.JSON(http.StatusOK, resp)
}

/* PlayerIngredientProduceReq [ends]. */

/* PlayerIngredientProgressCancelReq [begins]. */
type PlayerIngredientProgressCancelReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	PtrIngredientProgressId           *int32 `form:"ingredientProgressId"`
	PtrAutoCollect                    *int32 `form:"autoCollect"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
}

func (p *playerController) PlayerIngredientProgressCancel(c *gin.Context) {
	var req PlayerIngredientProgressCancelReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)

	playerId := int32(c.GetInt(api.PLAYER_ID))

	if nil == req.PtrAutoCollect {
		Logger.Warn("PlayerIngredientProgressCancel, lack `req.PtrAutoCollect`", zap.Any("playerId", playerId))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrIngredientProgressId && nil == req.PtrTargetPlayerBuildableBindingId {
		Logger.Warn("PlayerIngredientProgressCancel, lack `req.PtrIngredientProgressId` or `req.PtrTargetPlayerBuildableBindingId`", zap.Any("playerId", playerId))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil != req.PtrIngredientProgressId {
		/*trx start*/
		tx := storage.MySQLManagerIns.MustBegin()
		defer tx.Rollback()

		ingredientProgress, err := models.QueryOneIngredientProgress(tx, playerId, *(req.PtrIngredientProgressId), true)
		if err != nil {
			Logger.Error("PlayerIngredientProgressCancel, targeted ingredientProgress doesn't exist#1", zap.Any("playerId", playerId), zap.Any("*(req.PtrIngredientProgressId)", *(req.PtrIngredientProgressId)), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		if nil == ingredientProgress {
			Logger.Error("PlayerIngredientProgressCancel, targeted ingredientProgress doesn't exist#2", zap.Any("playerId", playerId), zap.Any("*(req.PtrIngredientProgressId)", *(req.PtrIngredientProgressId)), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		if nil == ingredientProgress.PlayerBuildableBindingId {
			Logger.Warn("PlayerIngredientProgressCancel, nil == ingredientProgress.PlayerBuildableBindingId", zap.Any("playerId", playerId))
			c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
			return
		}

		ingredientProgressState := *(ingredientProgress.PtrState)

		if nil != ingredientProgress.RecipeId {
			convertedRecipeId := int32(ingredientProgress.RecipeId.Int64)
			recipeIngredientBindingList, err := models.GetRecipeRequireIngredientBindingList(tx, convertedRecipeId)
			if err != nil {
				Logger.Error("PlayerIngredientProgressCancel, error calling `models.GetRecipeRequireIngredientBindingList`", zap.Any("playerId", playerId), zap.Error(err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}

			for _, recipeIngredientBinding := range recipeIngredientBindingList {
				_, err := models.UpsertKnapsackRecord(tx, recipeIngredientBinding.IngredientId, recipeIngredientBinding.Count, playerId)
				if err != nil {
					Logger.Error("PlayerIngredientProgressCancel, error calling `models.UpsertKnapsackRecord`", zap.Any("playerId", playerId), zap.Any("recipeIngredientBinding", recipeIngredientBinding), zap.Error(err))
					c.Set(api.RET, Constants.RetCode.MysqlError)
					return
				}
			}
		} else {
			if models.INGREDIENT_PROGRESS_STATE_PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED == ingredientProgressState || models.INGREDIENT_PROGRESS_STATE_RECLAIMING_TO_BE_MANUALLY_COLLECTED == ingredientProgressState {
				_, err := models.UpsertKnapsackRecord(tx, *ingredientProgress.IngredientId, 1 /* Hardcoded temporarily. -- YFLu */, playerId)
				if err != nil {
					Logger.Error("PlayerIngredientProgressCancel, error calling `models.UpsertKnapsackRecord`", zap.Any("playerId", playerId), zap.Any("ingredientProgress", ingredientProgress), zap.Error(err))
					c.Set(api.RET, Constants.RetCode.MysqlError)
					return
				}
			}
		}

		convertedTargetPlayerBuildableBindingId := int32(ingredientProgress.PlayerBuildableBindingId.Int64)

		ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, &convertedTargetPlayerBuildableBindingId, req.PtrAutoCollect)
		if err != nil {
			Logger.Error("PlayerIngredientProgressCancel, error calling `models.CheckIngredientCompletion`", zap.Any("playerId", playerId), zap.Any("convertedTargetPlayerBuildableBindingId", convertedTargetPlayerBuildableBindingId), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		pRowsDeleted, err := models.DeleteIngredientProgress(tx, playerId, ingredientProgress)
		if nil != err || 0 >= *pRowsDeleted {
			Logger.Error("PlayerIngredientProgressCancel, error calling `models.DeleteIngredientProgress`", zap.Any("playerId", playerId), zap.Any("ingredientProgress", ingredientProgress), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		ingredientProgressList, _, _, _, err = models.CheckIngredientCompletion(tx, playerId, &convertedTargetPlayerBuildableBindingId, req.PtrAutoCollect)
		if err != nil {
			Logger.Error("PlayerIngredientProgressCancel, error calling `models.CheckIngredientCompletion`", zap.Any("playerId", playerId), zap.Any("convertedTargetPlayerBuildableBindingId", convertedTargetPlayerBuildableBindingId), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
		if err != nil {
			Logger.Error("PlayerIngredientProgressCancel, error calling `models.GetAllKnapsack`", zap.Any("playerId", playerId), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		err = tx.Commit()
		if err != nil {
			Logger.Error("PlayerIngredientProgressCancel, error committing", zap.Any("playerId", playerId), zap.Error(err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		/*trx finish*/
		resp := struct {
			Ret                    int64                        `json:"ret"`
			ReqSeqNum              int64                        `json:"reqSeqNum"`
			IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
			KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
		}{Constants.RetCode.Ok, req.ReqSeqNum, ingredientProgressList, knapsackRecordList}

		c.JSON(http.StatusOK, resp)
	} else {
		c.Set(api.RET, Constants.RetCode.NotImplementedYet)
		return
	}
}

/* PlayerIngredientProgressCancelReq [ends]. */

/* PlayerKnapsackQueryReq [begins]. */
type KnapsackQueryReq struct {
	Token        string `form:"intAuthToken"`
	ReqSeqNum    int64  `form:"reqSeqNum"`
	TargetPage   int64  `form:"targetPage"`
	CountPerPage int    `form:"countPerPage"`
}

func (p *playerController) KnapsackQuery(c *gin.Context) {
	var req KnapsackQueryReq
	if req.CountPerPage == 0 {
		req.CountPerPage = 15
	}
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)

	playerId := int32(c.GetInt(api.PLAYER_ID))
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientProgressList, err := models.CheckIngredientCompletionOfPlayer(tx, playerId)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret                    int64                        `json:"ret"`
		ReqSeqNum              int64                        `json:"reqSeqNum"`
		TargetPage             int64                        `json:"targetPage"`
		CountPerPage           int                          `json:"countPerPage"`
		TotalCount             int                          `json:"totalCount"`
		KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
		IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		req.TargetPage,
		req.CountPerPage,
		len(knapsackRecordList),
		knapsackRecordList,
		ingredientProgressList,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerKnapsackQueryReq [ends]. */

/* PlayerKnapsackSynthesizeReq [begins]. */
type KnapsackSynthesizeReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	Consumables                       string `form:"consumables"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
	PtrAutoCollect                    *int32 `form:"autoCollect"`
	PtrTargetBuildableId              *int32 `form:"targetBuildableId"`
	SkipPlayerRecipeCheck             *int32 `form:"skipPlayerRecipeCheck"`
}

func (p *playerController) KnapsackSynthesize(c *gin.Context) {
	var req KnapsackSynthesizeReq

	err := c.ShouldBindWith(&req, binding.FormPost)
	if err != nil {
		Logger.Warn("req data error", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrAutoCollect {
		Logger.Warn("req data error")
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	if nil == req.PtrTargetBuildableId {
		Logger.Warn("req data error")
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	if nil == req.PtrTargetPlayerBuildableBindingId {
		Logger.Warn("req data error")
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	var consumables []*models.Consumable
	json.Unmarshal([]byte(req.Consumables), &consumables)

	playerId := int32(c.GetInt(api.PLAYER_ID))
	ptrTargetPlayerBuildableBindingId := req.PtrTargetPlayerBuildableBindingId
	ptrTargetBuildableId := req.PtrTargetBuildableId

	Logger.Info("Calling `KnapsackSynthesize`", zap.Any("ptrTargetPlayerBuildableBindingId", ptrTargetPlayerBuildableBindingId), zap.Any("ptrTargetBuildableId", ptrTargetBuildableId))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	Logger.Info("", zap.Any("consumables", consumables))
	_, mapOfIngredientWithCount, err := models.ComposeMapOfIngredientWithCount(tx, consumables)

	if err != nil {
		Logger.Warn("Error composing the map of ingredients to use \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	matchedRecipeRecordList, err := models.QueryPlayerMatchedRecipes(tx, mapOfIngredientWithCount, playerId, *ptrTargetPlayerBuildableBindingId)

	if err != nil {
		Logger.Warn("Error querying the list of matched recipe records #1 \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.NonexistentRecipe)
		return
	}

	if 0 >= len(matchedRecipeRecordList) {
		Logger.Warn("Error querying the list of matched recipe records #2 \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.NonexistentRecipe)
		return
	}

	selectedRecipeRecord := matchedRecipeRecordList[0]
	Logger.Info("Selected a recipeRecord", zap.Any("selectedRecipeRecord", selectedRecipeRecord))

	if req.SkipPlayerRecipeCheck != nil && *req.SkipPlayerRecipeCheck == 1 {
		recipeState, err := models.GetPlayerRecipeState(tx, playerId, selectedRecipeRecord.Id)
		if err != nil {
			Logger.Warn("Mysql error\n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		switch recipeState {
		case 0, models.PLAYER_RECIPE_LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN:
			Logger.Warn("Recipe name unknown\n", zap.Any("recipeState", recipeState))
			c.Set(api.RET, Constants.RetCode.RecipeNameUnknown)
			return
		}
	}

	incompleteIngredientProgressCount := 0
	var millisToStartForImmediateInsertion int32 = 0
	var occupiedResidenceCount int32 = 0
	var toCalculateProgressList []*models.IngredientProgress
	for _, autoCollect := range []int{1, 0} {
		useManualCollectMark := int32(autoCollect)
		pUseManualCollectMark := &useManualCollectMark
		ingredientProgressList, _, pMillisToStartForImmediateInsertion, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, pUseManualCollectMark)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		for _, progress := range ingredientProgressList {
			if *progress.PtrState == models.INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED {
				incompleteIngredientProgressCount++
			}
		}

		if pMillisToStartForImmediateInsertion != nil && (*pMillisToStartForImmediateInsertion) != 0 {
			millisToStartForImmediateInsertion = *pMillisToStartForImmediateInsertion
		}
		toCalculateProgressList = ingredientProgressList
	}

	occupiedResidence, err := models.CalculateOccupiedResidenceCountByIngredientProgressList(tx, playerId, toCalculateProgressList)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	occupiedResidenceCount += occupiedResidence

	knapsackResidenceCount, err := models.CalculateKnapsackOccupiedResidenceCount(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	occupiedResidenceCount += knapsackResidenceCount
	allowedResidenceCount, err := models.CalculateAllowedResidenceCount(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	Logger.Info("ResidenceCounts: ", zap.Any("occupied", occupiedResidenceCount), zap.Any("allowed", allowedResidenceCount))

	targetIngredients, err := models.GetRecipeTargetIngredientBindingList(tx, selectedRecipeRecord.Id)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientMap, err := models.GetAllIngredientMap(tx)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	for _, consumable := range mapOfIngredientWithCount {
		occupiedResidenceCount = occupiedResidenceCount - (consumable.ResidenceOccupation * consumable.Count)
	}

	for _, target := range targetIngredients {
		occupiedResidenceCount = occupiedResidenceCount + (ingredientMap[target.IngredientId].ResidenceOccupation * target.Count)
	}

	if occupiedResidenceCount > allowedResidenceCount {
		c.Set(api.RET, Constants.RetCode.PopulationLimitExceeded)
		return
	}

	if models.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING <= incompleteIngredientProgressCount {
		c.Set(api.RET, Constants.RetCode.IngredientProgressMaxPerPlayerBuildableBindingExceeded)
		return
	}

	var resultedIngredient *models.Ingredient
	var resultedIngredientList []*models.Ingredient
	var resultedIngredientProgress *models.IngredientProgress
	successfullyInsertedRecordIntoKnapsackOrIngredientProgress := false
	if 0 >= selectedRecipeRecord.DurationMillis {
		rowsUpserted, err := models.UpsertKnapsackRecordByRecipeTarget(tx, &(selectedRecipeRecord.Id), selectedRecipeRecord.TargetIngredientId, selectedRecipeRecord.TargetIngredientCount, playerId)
		if err != nil {
			Logger.Warn("Error inserting new Knapsack record \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		Logger.Info("New record inserted into knapsack \n", zap.Any("rowsUpserted", rowsUpserted))
		if 0 < rowsUpserted {
			successfullyInsertedRecordIntoKnapsackOrIngredientProgress = true
		} else {
			Logger.Warn("Error inserting new Knapsack record \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		if selectedRecipeRecord.TargetIngredientId != nil {
			resultedIngredient, err = models.QueryOneIngredient(tx, *selectedRecipeRecord.TargetIngredientId, false) // Temporarily only immediately synthesized `resultedIngredient` is supported. -- YFLu
			if err != nil {
				Logger.Info("Error querying the new `resultedIngredient`", zap.Any("err:", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		} else {
			resultedIngredientList, err = models.GetRecipeTargetIngredientList(tx, selectedRecipeRecord.Id)
		}
		resultedIngredientProgress = nil

		_, err = models.UnlockPlayerRecipe(tx, playerId, selectedRecipeRecord.Id)
		if err != nil {
			Logger.Info("Error update recipe state", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
	} else {
		pResultedIngredientProgressId, err := models.InsertIngredientProgressFromRecipe(tx, playerId, selectedRecipeRecord, ptrTargetPlayerBuildableBindingId, millisToStartForImmediateInsertion, req.PtrAutoCollect)
		if err != nil {
			Logger.Warn("Error inserting new IngredientProgress record \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		targetIngredientProgressId := int32(*pResultedIngredientProgressId)
		resultedIngredientProgress, err = models.QueryOneIngredientProgress(tx, playerId, targetIngredientProgressId, false)
		if err != nil {
			Logger.Info("Error querying the `resultedIngredientProgress`", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		successfullyInsertedRecordIntoKnapsackOrIngredientProgress = true
		resultedIngredient = nil
	}

	if true == successfullyInsertedRecordIntoKnapsackOrIngredientProgress && nil != mapOfIngredientWithCount {
		for _, singleIngredientWithCount := range mapOfIngredientWithCount {
			rowsDecremented, err := models.DecrementKnapsackRecord(tx, singleIngredientWithCount.Ingredient.ID, int(singleIngredientWithCount.Count), playerId)
			if err != nil {
				Logger.Warn("Error consuming corresponding Knapsack records#1 \n", zap.Any(":", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
			if 0 >= rowsDecremented {
				Logger.Warn("Error consuming corresponding Knapsack records#2 \n", zap.Any(":", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		Logger.Warn("Error querying the new `knapsackRecordList`", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, req.PtrAutoCollect)
	if err != nil {
		Logger.Warn("Error querying the resulted `ingredientProgressList`", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	playerRecipe, err := models.GetPlayerRecipe(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	tx.Commit()

	resp := struct {
		Ret                        int64                        `json:"ret"`
		ReqSeqNum                  int64                        `json:"reqSeqNum"`
		Gold                       int32                        `json:"gold"`
		ResultedIngredientProgress *models.IngredientProgress   `json:"resultedIngredientProgress"`
		ResultedIngredient         *models.Ingredient           `json:"resultedIngredient"`
		IngredientProgressList     []*models.IngredientProgress `json:"ingredientProgressList"`
		KnapsackRecordList         []*models.Knapsack           `json:"knapsack"`
		RecipeList                 []*models.PlayerRecipeResp   `json:"playerRecipeList"`
		ResultedIngredientList     []*models.Ingredient         `json:"resultedIngredientList"`
	}{
		Constants.RetCode.SuccessfulKnownRecipeAndKnownIngredient,
		req.ReqSeqNum,
		0, // Hardcoded temporarily. -- YFLu
		resultedIngredientProgress,
		resultedIngredient,
		ingredientProgressList,
		knapsackRecordList,
		playerRecipe,
		resultedIngredientList,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerKnapsackSynthesizeReq [ends]. */

/* PlayerIngredientProduceReq [begins]. */
type PlayerIngredientReclaimReq struct {
	Token                             string  `form:"intAuthToken"`
	ReqSeqNum                         int64   `form:"reqSeqNum"`
	PtrTargetPlayerBuildableBindingId *int32  `form:"targetPlayerBuildableBindingId"`
	TargetIngredientList              *string `form:"targetIngredientList"`
}

func (p *playerController) PlayerIngredientReclaim(c *gin.Context) {
	var req PlayerIngredientReclaimReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	if nil != err {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		Logger.Error("Reclaim err 1:", zap.Error(err))
		return
	}

	if nil == req.PtrTargetPlayerBuildableBindingId {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		Logger.Error("Reclaim err 2:", zap.Error(err))
		return
	}

	if nil == req.TargetIngredientList || len(*req.TargetIngredientList) == 0 {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		Logger.Error("Reclaim param err:", zap.Error(err))
		return
	}

	var targetIngredientList map[int32]int
	_ = json.Unmarshal([]byte(*req.TargetIngredientList), &targetIngredientList)

	Logger.Info("PlayerIngredientReclaim", zap.Any("targetIngredientList", targetIngredientList))
	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	incompleteIngredientProgressCount := 0
	var millisToStartForImmediateInsertion int32 = 0
	for _, autoCollect := range []int{1, 0} {
		useManualCollectMark := int32(autoCollect)
		pUseManualCollectMark := &useManualCollectMark
		ingredientProgressList, _, _, pMillisToStartForImmediateInsertion, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, pUseManualCollectMark)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		for _, progress := range ingredientProgressList {
			if *progress.PtrState == models.INGREDIENT_PROGRESS_STATE_PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED {
				incompleteIngredientProgressCount++
			}
		}

		if pMillisToStartForImmediateInsertion != nil {
			millisToStartForImmediateInsertion = *pMillisToStartForImmediateInsertion
		}
	}

	if models.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING <= incompleteIngredientProgressCount {
		c.Set(api.RET, Constants.RetCode.IngredientProgressMaxPerPlayerBuildableBindingExceeded)
		return
	}

	resultedIngredientProgressIdList := make(map[int64]bool)
	for ingredientId, count := range targetIngredientList {
		for tmpCount := 0; tmpCount < count; tmpCount++ {
			targetIngredient, err := models.QueryOneIngredient(tx, ingredientId, false)
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}

			productionDurationMillis := targetIngredient.BaseReclaimDurationMillis
			targetIngredientProgressId, err := models.InsertIngredientProgressToReclaim(
				tx,
				playerId,
				ingredientId,
				req.PtrTargetPlayerBuildableBindingId,
				productionDurationMillis,
				millisToStartForImmediateInsertion,
			)
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}

			resultedIngredientProgress, err := models.QueryOneIngredientProgress(tx, playerId, int32(*targetIngredientProgressId), false)
			if err != nil {
				Logger.Info("Error querying the `resultedIngredientProgress`", zap.Any("err:", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}

			Logger.Info("", zap.Any("resultedIngredientProgress", resultedIngredientProgress))
			rowsDecremented, err := models.DecrementKnapsackRecord(tx, *resultedIngredientProgress.IngredientId, 1, playerId)
			if err != nil {
				Logger.Warn("Error consuming corresponding Knapsack records#1 \n", zap.Any(":", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
			if 0 >= rowsDecremented {
				Logger.Warn("Error consuming corresponding Knapsack records#2 \n", zap.Any(":", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}

			resultedIngredientProgressIdList[*targetIngredientProgressId] = true

			millisToStartForImmediateInsertion = millisToStartForImmediateInsertion + productionDurationMillis
		}
	}

	useManualCollectMark := int32(0)
	pUseManualCollectMark := &useManualCollectMark
	ingredientProgressList, _, _, _, err := models.CheckIngredientCompletion(tx, playerId, req.PtrTargetPlayerBuildableBindingId, pUseManualCollectMark)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resultedIngredientProgressList := make([]*models.IngredientProgress, len(resultedIngredientProgressIdList))
	progressListCount := 0
	for _, ingredientProgress := range ingredientProgressList {
		_, exist := resultedIngredientProgressIdList[int64(ingredientProgress.Id)]
		if exist {
			resultedIngredientProgressList[progressListCount] = ingredientProgress
			progressListCount++
		}
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		Logger.Warn("Error querying the new `knapsackRecordList`", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	/*trx finish*/
	resp := struct {
		Ret                            int64                        `json:"ret"`
		ReqSeqNum                      int64                        `json:"reqSeqNum"`
		IngredientProgressList         []*models.IngredientProgress `json:"ingredientProgressList"`
		ResultedIngredientProgressList []*models.IngredientProgress `json:"resultedIngredientProgressList"`
		KnapsackRecordList             []*models.Knapsack           `json:"knapsack"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		ingredientProgressList,
		resultedIngredientProgressList,
		knapsackRecordList,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerIngredientProduceReq [ends]. */

/* PlayerIngredientProgressBoostingReq [begins]. */
type PlayerIngredientProgressBoostingReq struct {
	Token                             string `form:"intAuthToken"`
	ReqSeqNum                         int64  `form:"reqSeqNum"`
	PtrTargetPlayerBuildableBindingId *int32 `form:"targetPlayerBuildableBindingId"`
	PtrAutoCollect                    *int32 `form:"autoCollect"`
}

func (p *playerController) PlayerIngredientProgressBoosting(c *gin.Context) {
	var req PlayerIngredientProduceReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	if nil != err {
		Logger.Warn("Invalid request params", zap.Any("req", req))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	if nil == req.PtrTargetPlayerBuildableBindingId {
		Logger.Warn("Invalid request params", zap.Any("req", req))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	ingredientProgressList, err := models.BoostIngredientProgress(tx, playerId, req.PtrTargetPlayerBuildableBindingId, req.PtrAutoCollect)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	// Logger.Info("PlayerBuildableBindingIngredientCollectReq returning", zap.Any("playerId", playerId), zap.Any("targetPlayerBuildableBindingId", *req.PtrTargetPlayerBuildableBindingId), zap.Any("ingredientProgressList", ingredientProgressList), zap.Any("knapsackRecordList", knapsackRecordList))
	/*trx finish*/
	resp := struct {
		Ret                    int64                        `json:"ret"`
		ReqSeqNum              int64                        `json:"reqSeqNum"`
		IngredientProgressList []*models.IngredientProgress `json:"ingredientProgressList"`
		KnapsackRecordList     []*models.Knapsack           `json:"knapsack"`
	}{Constants.RetCode.Ok, req.ReqSeqNum, ingredientProgressList, knapsackRecordList}

	c.JSON(http.StatusOK, resp)
}

/* PlayerIngredientProgressBoostingReq [ends]. */

func (p *playerController) GlobalConfRead(c *gin.Context) {
	confMap := Conf.GlobalConf
	resp := struct {
		Ret                     int64       `json:"ret"`
		AnonymousPlayerEnabled  interface{} `json:"anonymousPlayerEnabled"`
		AnonymousPlayerEndpoint interface{}/*在common/conf.go中定义的*/ `json:"anonymousPlayerEndpoint"`
	}{
		Constants.RetCode.Ok,
		confMap["anonymousPlayerEnabled"],
		confMap["anonymousPlayerEndpoint"],
	}

	c.JSON(http.StatusOK, resp)
}

func (p *playerController) SmsCaptchaObtain(c *gin.Context) {
	var req SmsCaptchaReq
	err := c.ShouldBindQuery(&req)
	api.CErr(c, err)
	if err != nil || req.Num == "" || req.CountryCode == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	redisKey := req.redisKey()
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.UnknownError)
		return
	}

	/* trx starts */
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

  var testPlayer *models.Player = nil
  if Conf.IsTest {
    // When "true == IsTest", we allow obtaining the captcha by "magic player names", by now only the "test accounts" can have non-null field "player.name"
    testPlayer, err = models.GetPlayerByName(tx, req.Num)
    if err != nil {
      Logger.Error("Error occurred when querying player by the input name", zap.Any("req.Num", req.Num), zap.Error(err))
      c.Set(api.RET, Constants.RetCode.MysqlError)
      return
    }
  }

	if nil == testPlayer {
    // "false == IsTest" or haven't obtained a valid "test account"
    if "86" != req.CountryCode || !RE_CHINA_PHONE_NUM.MatchString(req.Num) {
		// TODO: Don't be limited to Chinese phone numbers
      c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
      return
		}
	}

  captcha := strconv.Itoa(utils.Rand.Number(1000, 9999))
  if nil == testPlayer {
    smsSendErr := sendMessage(req.Num, req.CountryCode, captcha)
    if 0 != smsSendErr {
      c.Set(api.RET, Constants.RetCode.ErrSendingSms)
      return
    }
  }

	resp := struct {
		Ret                        int64 `json:"ret"`
    Captcha                    string `json:"smsLoginCaptcha"`
		SmsCaptchaReq
	}{
    Ret: Constants.RetCode.Ok,
  }

  if nil != testPlayer {
    Logger.Info("Obtaining captcha for a test account", zap.Any("magic name", req.Num), zap.Any("magic captcha", captcha))
    resp.Ret = Constants.RetCode.IsTestAcc
    resp.Captcha = captcha
  }

	nowSeconds := utils.UnixtimeSec()
  persistentCaptcha := &models.PersistentCaptcha {
    Authkey: redisKey,
    Value: captcha,
    CreatedAt: nowSeconds*1000,
    ExpiresAt: (nowSeconds + Constants.Player.SmsExpiredSeconds)*1000,
  }

  err = persistentCaptcha.Insert(tx)
	if err != nil {
    Logger.Error("Error occurred when inserting persistentCaptcha", zap.Any("persistentCaptcha", persistentCaptcha), zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
    Logger.Error("Error occurred when committing during `SmsCaptchaObtain`", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	/* trx finished */

  Logger.Debug("Generated and sent new captcha for", zap.String("key", redisKey), zap.String("captcha", captcha))

	c.JSON(http.StatusOK, resp)
}

func sendMessage(mobile string, nationcode string, captchaCode string) int32 {
	tel := &tel{
		Mobile:     mobile,
		Nationcode: nationcode,
	}

	captchaExpireMin := strconv.Itoa(int(Constants.Player.SmsExpiredSeconds) / 60)
	params := [2]string{captchaCode, captchaExpireMin}
	appkey := "xxxxxxxxxxxxxxx" // TODO: Fill in your own Tencent SMS credentials.
	rand := strconv.Itoa(utils.Rand.Number(1000, 9999))
	now := utils.UnixtimeSec()

	hash := sha256.New()
	hash.Write([]byte("appkey=" + appkey + "&random=" + rand + "&time=" + strconv.FormatInt(now, 10) + "&mobile=" + mobile))
	md := hash.Sum(nil)
	sig := hex.EncodeToString(md)

	reqData := &captchaReq{
		Ext:    "",
		Extend: "",
		Params: &params,
		Sig:    sig,
		Sign:   "yyyyyyyyy", // Fill in your Tencent SMS template sign
		Tel:    tel,
		Time:   now,
		Tpl_id: 99999999, // Fill in your Tencent SMS template id
	}
	reqDataString, err := json.Marshal(reqData)
	req := bytes.NewBuffer([]byte(reqDataString))
	if err != nil {
		Logger.Error("Error occurred when calling `sendMessage` #1", zap.Error(err))
		return -1
	}

  appid := "zzzzzzzzzzzzzzzzzzzzzzz" // Fill in your Tencent SMS appid
	resp, err := http.Post("https://yun.tim.qq.com/v5/tlssmssvr/sendsms?sdkappid=" + appid + "&random="+rand,
		"application/json",
		req)
	if err != nil {
		Logger.Error("Error occurred when calling `sendMessage` #2", zap.Error(err))
	}
	defer resp.Body.Close()
	respBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		Logger.Error("Error occurred when calling `sendMessage` #3", zap.Error(err))
		return -1
	}

	type bodyStruct struct {
		Result int32 `json:"result"`
	}
	var body bodyStruct
	json.Unmarshal(respBody, &body)
	Logger.Info("End of calling `sendMessage`", zap.Any("body", body))
	return body.Result
}

func (p *playerController) AnonymousLogin(c *gin.Context) {
	var req AnonymousLoginReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil || req.DeviceUuid == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	//TODO 1. regex deviceUuid
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	player, err := p.maybeCreateNewPlayer(&req, tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)

	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
	}{Constants.RetCode.Ok, token, expiresAt, player.ID}

	c.JSON(http.StatusOK, resp)
}

func (p *playerController) SMSCaptchaLogin(c *gin.Context) {
	var req SmsCaptchaReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if nil != err || "" == req.Num || "" == req.CountryCode || "" == req.Captcha {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	now := utils.UnixtimeMilli()

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

  redisKey := req.redisKey()
  persistentCaptcha, err := models.GetPersistentCaptchaByKey(tx, redisKey, req.Captcha, now)
  if nil != err || nil == persistentCaptcha {
		c.Set(api.RET, Constants.RetCode.SmsCaptchaNotMatch)
		return
  }

	player, err := p.maybeCreateNewPlayer(&req, tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	token := utils.TokenGenerator(32)
	intAuthTokenExpiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = models.CheckUserAchievementExistAndAllocate(tx, player.ID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
	}{Constants.RetCode.Ok, token, intAuthTokenExpiresAt, player.ID}

	c.JSON(http.StatusOK, resp)
}

func (p *playerController) IntAuthTokenLogin(c *gin.Context) {
	token := p.getIntAuthToken(c)
	if token == "" {
		return
	}
	playerLogin, err := models.GetPlayerLoginByToken(token)
	api.CErr(c, err)
	if err != nil || playerLogin == nil {
		Logger.Info("IntAuthTokenLogin Failed")
		c.Set(api.RET, Constants.RetCode.InvalidToken)
		return
	}
	expiresAt := playerLogin.UpdatedAt + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	resp := struct {
		Ret         int64             `json:"ret"`
		Token       string            `json:"intAuthToken"`
		ExpiresAt   int64             `json:"expiresAt"`
		PlayerID    int32             `json:"playerId"`
		DisplayName models.NullString `json:"displayName"`
	}{Constants.RetCode.Ok, token, expiresAt,
		playerLogin.PlayerID, playerLogin.DisplayName}
	c.JSON(http.StatusOK, resp)
}
func (p *playerController) IntAuthTokenLogout(c *gin.Context) {
	token := p.getIntAuthToken(c)
	if token == "" {
		return
	}
	err := models.DelPlayerLoginByToken(nil, token)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.UnknownError)
		return
	}
	c.Set(api.RET, Constants.RetCode.Ok)
}

func (p *playerController) TokenWithPlayerIdAuth(c *gin.Context) {
	var req struct {
		Token    string `form:"intAuthToken"`
		PlayerId int32  `form:"targetPlayerId"`
	}

	err := c.ShouldBindWith(&req, binding.FormPost)
	if err == nil {
		exist, err := models.EnsuredPlayerLoginByToken(req.PlayerId, req.Token)
		api.CErr(c, err)
		if err == nil && exist {
			c.Set(api.PLAYER_ID, int(req.PlayerId))
			return
		}
	}
	Logger.Info("TokenWithPlayerIdAuth Failed", zap.String("token", req.Token),
		zap.Int32("id", req.PlayerId))
	c.Set(api.RET, Constants.RetCode.InvalidToken)
	c.Abort()
}

func (p *playerController) TokenAuth(c *gin.Context) {
	var req struct {
		Token string `form:"intAuthToken"`
	}
	err := c.ShouldBindWith(&req, binding.FormPost)
	if err == nil {
		playerLogin, err := models.GetPlayerLoginByToken(req.Token)
		api.CErr(c, err)
		if err == nil && playerLogin != nil {
			c.Set(api.PLAYER_ID, int(playerLogin.PlayerID))
			return
		}
	}
	Logger.Info("TokenAuth Failed", zap.String("token", req.Token))
	c.Set(api.RET, Constants.RetCode.InvalidToken)
	c.Abort()
}

func (p *playerController) CallLimitController(c *gin.Context) {
	requestPath := c.Request.URL.Path
	playerId := int32(c.GetInt(api.PLAYER_ID))
	configMap := Conf.GlobalConf
	apiLimitConfig, exist := configMap["apiCallLimit"]
	if !exist || apiLimitConfig == nil {
		return
	}

	apiLimitConfigMap, _ := apiLimitConfig.(map[string]interface{})

	Logger.Info("api limit map: ", zap.Any("", apiLimitConfigMap))
	apiLimitCount, exist := apiLimitConfigMap[requestPath]
	if !exist || apiLimitCount == nil {
		return
	}

	Logger.Info("api limit #1: ", zap.Any("", apiLimitCount))
	apiLimitCountPerMinute, _ := apiLimitCount.(float64)
	Logger.Info("api limit: ", zap.Any("", apiLimitCountPerMinute))
	if apiLimitCountPerMinute < 1 {
		return
	}
	limitKey := fmt.Sprintf("api:limit:%s:%v", requestPath, playerId)
	currentCountQ := storage.RedisManagerIns.LLen(limitKey)
	if currentCountQ.Err() != nil {
		Logger.Warn("redis error \n", zap.Any(":", currentCountQ.Err()))
		c.Set(api.RET, Constants.RetCode.RedisError)
		c.Abort()
	}
	if currentCountQ.Val() > int64(apiLimitCountPerMinute) {
		c.Set(api.RET, Constants.RetCode.APICallLimitExceeded)
		c.Abort()
	}

	existQ := storage.RedisManagerIns.Exists(limitKey)
	if existQ.Err() != nil {
		Logger.Warn("redis error \n", zap.Any(":", existQ.Err()))
		c.Set(api.RET, Constants.RetCode.RedisError)
		c.Abort()
	}

	now := utils.UnixtimeMilli()
	if existQ.Val() == 0 {
		err := storage.RedisManagerIns.Watch(func(tx *redis.Tx) error {
			localErr := tx.RPush(limitKey, now).Err()
			if nil != localErr {
				return localErr
			}

			localErr = tx.Expire(limitKey, time.Minute).Err()
			return localErr
		}, limitKey)

		if nil != err {
			Logger.Warn("redis error \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.RedisError)
			c.Abort()
		}
	} else {
		err := storage.RedisManagerIns.RPushX(limitKey, now).Err()
		if nil != err {
			Logger.Warn("redis error \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.RedisError)
			c.Abort()
		}
	}
}

func (p *playerController) maybeCreateNewPlayer(req ExtAuthLoginReq, tx *sqlx.Tx) (*models.Player, error) {
	isUsingSmsAuth := false
	extAuthId := req.extAuthId()
	var authChannel int32
	if _, ok := req.(*SmsCaptchaReq); ok {
		isUsingSmsAuth = true
		authChannel = int32(Constants.AuthChannel.Sms)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId), zap.Any("req.Num", req.(*SmsCaptchaReq).Num))
	} else if _, ok = req.(*AnonymousLoginReq); ok {
		authChannel = int32(Constants.AuthChannel.DarwinDeviceUUID)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId))
	} else if _, ok = req.(*WechatGameLoginReq); ok {
		authChannel = int32(Constants.AuthChannel.WechatGame)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId))
	} else if _, ok = req.(*GameCenterReq); ok {
		// WARNING: This is a dirty hack!
		// _, isUsingGameCenterAuth := req.(*GameCenterReq)
		authChannel = int32(Constants.AuthChannel.GameCenter)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId))
	} else if _, ok = req.(*AnonymousByteDanceLoginReq); ok {
		// WARNING: This is a dirty hack!
		// _, isUsingGameCenterAuth := req.(*GameCenterReq)
		authChannel = int32(Constants.AuthChannel.ByteDance)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId))
	} else {
		authChannel = int32(Constants.AuthChannel.GoogleAuth)
		Logger.Info("maybeCreateNewPlayer", zap.Any("authChannel", authChannel), zap.Any("isUsingSmsAuth", isUsingSmsAuth), zap.Any("extAuthId", extAuthId))
	}
	if isUsingSmsAuth && Conf.IsTest {
		// WARNING: This is a dirty hack!
		player, err := models.GetPlayerByName(tx, req.(*SmsCaptchaReq).Num)
		if err != nil {
			return nil, err
		}
		if player != nil {
			return player, nil
		}
	}
	bind, err := models.GetPlayerAuthBinding(authChannel, extAuthId, tx)
	if err != nil {
		return nil, err
	}
	if bind != nil {
		player, err := models.GetPlayerById(bind.PlayerID, tx)
		if err != nil {
			return nil, err
		}
		return player, nil
	} else {
		return p.createNewPlayer(extAuthId, authChannel, tx)
	}
}

func (p *playerController) createNewPlayer(extAuthId string, authChannel int32, tx *sqlx.Tx) (*models.Player, error) {
	Logger.Info("createNewPlayer", zap.Any("extAuthId", extAuthId), zap.Any("authChannel", authChannel))
	now := utils.UnixtimeMilli()
	player := models.Player{
		CreatedAt: now,
		UpdatedAt: now,
		Diamond:   int32(Constants.InitialDiamondPerPlayer),
	}
	err := player.Insert(tx)
	if err != nil {
		return nil, err
	}
	playerAuthBinding := models.PlayerAuthBinding{
		CreatedAt: now,
		UpdatedAt: now,
		Channel:   authChannel,
		ExtAuthID: extAuthId,
		PlayerID:  player.ID,
	}
	err = playerAuthBinding.Insert(tx)
	if err != nil {
		return nil, err
	}
	syncData := models.PlayerBulkSyncData{
		PlayerID:          player.ID,
		CreatedAt:         now,
		UpdatedAt:         now,
		PBEncodedSyncData: "",
	}
	err = syncData.Insert(tx)
	if err != nil {
		return nil, err
	}
	err = models.AllocateMissionForPlayerByBatchID(tx, player.ID, 1)
	if err != nil {
		return nil, err
	}
	err = models.AllocateAchievementForPlayerByBatchID(tx, player.ID, 0, nil, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	err = models.AddPlayerUnknownRecipe(tx, player.ID)
	if err != nil {
		return nil, err
	}
	err = models.AddPlayerStageBinding(tx, player.ID, 1, models.STAGE_UNLOCKED_BY_COMPLETING_PREV_STAGE)
	if err != nil {
		return nil, err
	}

	toInitIngredientIdList := []int32{}
	toInitIngredientCountList := []int32{}
	for idx, toInitIngredientId := range toInitIngredientIdList {
		increCount := toInitIngredientCountList[idx]
		_, localErr := models.UpsertKnapsackRecord(tx, toInitIngredientId, increCount, player.ID)
		if nil != localErr {
			return nil, err
		}
	}

	return &player, nil
}

func (p *playerController) getIntAuthToken(c *gin.Context) string {
	var req intAuthTokenReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil || req.Token == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return ""
	}
	return req.Token
}

type tel struct {
	Mobile     string `json:"mobile"`
	Nationcode string `json:"nationcode"`
}

type captchaReq struct {
	Ext    string     `json:"ext"`
	Extend string     `json:"extend"`
	Params *[2]string `json:"params"`
	Sig    string     `json:"sig"`
	Sign   string     `json:"sign"`
	Tel    *tel       `json:"tel"`
	Time   int64      `json:"time"`
	Tpl_id int32      `json:"tpl_id"`
}

func (p *playerController) GoogleAuthLogin(c *gin.Context) {
	var req GoogleAuthLoginReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil || req.GgAuthId == "" || req.GgAuthIdToken == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	ggAuthId := req.GgAuthId
	ggAuthIdToken := req.GgAuthIdToken

	ggApiClientId := "948416954294-tg7imgfb09kruk7essrlnaa0d6jmghsn.apps.googleusercontent.com"
	v := googleAuthIDTokenVerifier.Verifier{}
	err = v.VerifyIDToken(ggAuthIdToken, []string{
		ggApiClientId,
	})

	claimSet, err := googleAuthIDTokenVerifier.Decode(ggAuthIdToken)
	if nil != err && claimSet.Sub != ggAuthId {
		Logger.Warn("GoogleAuth signature verification error\n", zap.Any("req.GgAuthId", req.GgAuthId), zap.Any("claimSet", claimSet))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	Logger.Info("GoogleAuth signature verification succeeded\n", zap.Any("req.GgAuthId", req.GgAuthId), zap.Any("claimSet", claimSet))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	player, err := p.maybeCreateNewPlayer(&req, tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = models.CheckUserAchievementExistAndAllocate(tx, player.ID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	tx.Commit()
	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
	}{Constants.RetCode.Ok, token, expiresAt, player.ID}

	c.JSON(http.StatusOK, resp)
}

func (p *playerController) GameCenterLogin(c *gin.Context) {
	var req GameCenterReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil || req.PlayerId == "" || req.PublicKeyUrl == "" || req.SignatureB64Encoded == "" || req.SaltB64Encoded == "" || req.Timestamp == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	// bundleId := "LokcolInteractive.CuisineMaster" // This is a hack but this field is NOT assumed to be told by the client-side, though it should match that of the XCode project setting!
	bundleId := "MineralChem" // This is a hack but this field is NOT assumed to be told by the client-side, though it should match that of the XCode project setting!
	cert := inet.DownloadCert(req.PublicKeyUrl)
	if cert == nil {
		Logger.Warn("GameCenter cert not downloaded\n", zap.Any("GKLocalPlayerId", req.PlayerId), zap.Any("publicKeyUrl", req.PublicKeyUrl))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	err = game_center.VerifySig(req.SignatureB64Encoded, req.PlayerId, bundleId, req.SaltB64Encoded, req.Timestamp, cert)
	if nil != err {
		Logger.Warn("GameCenter signature verification error after cert downloaded\n", zap.Any("GKLocalPlayerId", req.PlayerId))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	player, err := p.maybeCreateNewPlayer(&req, tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = models.CheckUserAchievementExistAndAllocate(tx, player.ID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	tx.Commit()
	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
	}{Constants.RetCode.Ok, token, expiresAt, player.ID}

	c.JSON(http.StatusOK, resp)
}

type WechatGameLoginReq struct {
	Authcode  string `form:"code"`
	AvatarUrl string `form:"avatarUrl"`
	NickName  string `form:"nickName"`
	OpenId    string
	Unionid   string
}

func (req *WechatGameLoginReq) extAuthId() string {
	return req.OpenId
}

func (p *playerController) WechatGameLogin(c *gin.Context) {
	var req WechatGameLoginReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil || req.Authcode == "" || req.AvatarUrl == "" || req.NickName == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	baseInfo, err := wechatVerifier.WechatGameVerifierIns.GetOauth2Basic(req.Authcode)

	if err != nil {
		Logger.Error("Error occurred when calling `wechatVerifier.WechatGameVerifierIns.GetOauth2Basic`", zap.Any("authcode", req.Authcode), zap.Error(err))
		c.Set(api.RET, Constants.RetCode.WechatServerError)
		return
	}

	userInfo := wechatVerifier.UserInfo{
		Nickname:   req.NickName,
		HeadImgURL: req.AvatarUrl,
		OpenId:     baseInfo.OpenId,
	}

	if err != nil {
		Logger.Info("err", zap.Any("", err))
		c.Set(api.RET, Constants.RetCode.WechatServerError)
		return
	}

	if "" == userInfo.OpenId {
		Logger.Warn("After `wechatVerifier.WechatGameVerifierIns.GetOauth2Basic`, the OpenId is an empty string", zap.Any("resp body", baseInfo))
		c.Set(api.RET, Constants.RetCode.WechatServerError)
		return
	}

	req.OpenId = userInfo.OpenId

	player, err := p.maybeCreateNewPlayer(&req, tx)
	if nil != err {
		Logger.Error("Error creating the new `Player` and `PlayerAuthBinding` records", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	if nil != err {
		Logger.Error("Error inserting the new `PlayerLogin` record", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = models.CheckUserAchievementExistAndAllocate(tx, player.ID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = tx.Commit()
	if nil != err {
		Logger.Error("Error inserting the new `PlayerLogin` record", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
	}{
		Constants.RetCode.Ok,
		token,
		expiresAt,
		playerLogin.PlayerID,
	}
	c.JSON(http.StatusOK, resp)
}

type AnonymousByteDanceLoginReq struct {
	CachedUuid *string `form:"cachedUuid"`
}

func (req *AnonymousByteDanceLoginReq) extAuthId() string {
	if nil == req.CachedUuid {
		return ""
	} else {
		return *req.CachedUuid
	}
}

func (p *playerController) AnonymousByteDanceLogin(c *gin.Context) {
	var req AnonymousByteDanceLoginReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	var player *models.Player
	var toRetNewUuid = ""
	if nil == req.CachedUuid {
		newUuid, err := models.GenerateUuid(tx)
		if nil != err {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		req.CachedUuid = newUuid
		toRetNewUuid = *newUuid
		player, err = p.maybeCreateNewPlayer(&req, tx)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
	} else {
		authBinding, err := models.GetPlayerAuthBinding(int32(Constants.AuthChannel.ByteDance), *req.CachedUuid, tx)
		if nil == authBinding {
			c.Set(api.RET, Constants.RetCode.NonexistentUUIDChannelAuthPair)
			return
		}
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		if authBinding.PlayerID > 0 {
			player, err = models.GetPlayerById(authBinding.PlayerID, tx)
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}
	}

	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     player.ID,
		DisplayName:  player.DisplayName,
		UpdatedAt:    now,
	}
	err = playerLogin.Insert(tx)
	if nil != err {
		Logger.Error("Error inserting the new `PlayerLogin` record", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	err = models.CheckUserAchievementExistAndAllocate(tx, player.ID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if nil != err {
		Logger.Error("Mysql error", zap.Error(err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret       int64  `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int32  `json:"playerId"`
		NewUUID   string `json:"newUUID"`
	}{
		Constants.RetCode.Ok,
		token,
		expiresAt,
		playerLogin.PlayerID,
		toRetNewUuid,
	}
	c.JSON(http.StatusOK, resp)
}

type PlayerIapReceiptSubmitReq struct {
	ReceiptB64Encoded string `form:"receiptB64Encoded"`
}

func (p *playerController) PlayerIapReceiptSubmit(c *gin.Context) {
	var req PlayerIapReceiptSubmitReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil || req.ReceiptB64Encoded == "" {
		Logger.Warn("req data error \n", zap.Any(":", err))
		Logger.Warn("req ReceiptB64Encoded\n", zap.Any("receiptB64Encoded:", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	/*trx start*/
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	appleRecords, err := iap.Asn1Decode(req.ReceiptB64Encoded)
	if err != nil {
		Logger.Warn("Asn1Decode error:", zap.Any("err", err), zap.Any("playerId", playerId))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	transactionIdentifiers := make(map[string]string, len(appleRecords))
	for _, appleRecord := range appleRecords {
		transactionIdentifiers[appleRecord.TransactionIdentifier] = appleRecord.TransactionIdentifier
	}

	// TODO: Actually writes into table `legal_currency_payment_record`!
	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	/*trx finish*/
	resp := struct {
		Ret                    int64             `json:"ret"`
		TransactionIdentifiers map[string]string `json:"transactionIdentifiers"`
	}{Constants.RetCode.NotImplementedYet, transactionIdentifiers}

	c.JSON(http.StatusOK, resp)
}

// PlayerSyncDataReq sync buildable(gold, diamond) data request
type PlayerSyncDataReq struct {
	Token                           string `form:"intAuthToken"`
	Diamond                         int64  `form:"diamond"`
	pStageId                        *int64 `form:"stageId"`
	SyncData                        string `form:"syncData"`
	ReqSeqNum                       int64  `form:"reqSeqNum"`
	ToClaimIngredientProgressList   string `form:"toClaimIngredientProgressList"`
	ToClaimPlayerMissionBindingList string `form:"toClaimPlayerMissionBindingList"`
	ToClaimPurchaseIngredientList   string `form:"toClaimPurchaseIngredientList"`
	InterruptTutorialMask           string `form:"interruptTutorialMask"`
}

func (p *playerController) PlayerSyncData(c *gin.Context) {
	var req PlayerSyncDataReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil || req.SyncData == "" {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	// Logger.Info("PlayerSyncData req", zap.Any("req", req))
	proposedDiamondHolding := int32(req.Diamond) // TODO: Verify the feasibility of this update! -- YFLu, 2019-09-18
	playerId := int32(c.GetInt(api.PLAYER_ID))

	var toClaimIngredientProgressList []int32
	_ = json.Unmarshal([]byte(req.ToClaimIngredientProgressList), &toClaimIngredientProgressList)

	var toClaimPurchaseIngredientList []int32
	_ = json.Unmarshal([]byte(req.ToClaimPurchaseIngredientList), &toClaimPurchaseIngredientList)

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	_, err = models.UpdatePlayerDiamondHolding(tx, playerId, proposedDiamondHolding)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	var syncData *pb.SyncDataStruct
	var deletedIngredientProgressIds []int32
	var unclaimedMissionBindingIDs []int32
	var playerRecipe []*models.PlayerRecipeResp
	var playerIngredientForIdleGameList []*models.PlayerIngredientForIdleGame

	if nil == req.pStageId || 0 == (*req.pStageId) {
		// Reported by the "IdleGameMap".
		preBulkSyncData, err := models.GetPlayerBulkSyncDataByID(tx, playerId)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		_, err = models.UpdatePlayerInterruptTutorialMask(tx, playerId, req.InterruptTutorialMask)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		_, err = models.PlayerSyncData(tx, playerId, req.SyncData, req.ReqSeqNum)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		syncData = &pb.SyncDataStruct{}
		preSyncData := &pb.SyncDataStruct{}
		decoded, _ := base64.StdEncoding.DecodeString(req.SyncData)
		preDecoded, _ := base64.StdEncoding.DecodeString(preBulkSyncData.PBEncodedSyncData)
		_ = proto.Unmarshal(decoded, syncData)
		_ = proto.Unmarshal(preDecoded, preSyncData)

		prePlayerIngredientForIdleGameList, err := models.GetPlayerIngredientForIdleGameStateByPlayer(tx, playerId)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		/*
		 * For a newly registered player, its initialization of "player_ingredient_for_idlegame" records is carried out by its first proactive invocation of this "upsync" API.
		 *
		 * -- YFLu, 2019-11-27.
		 */
		err = models.CheckSyncDataToInsertPlayerIngredientForIdleGameState(tx, playerId, syncData)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		err = models.ClaimPurchaseIngredientList(tx, playerId, toClaimPurchaseIngredientList)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		playerIngredientForIdleGameList, err = models.GetPlayerIngredientForIdleGameStateByPlayer(tx, playerId)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		if nil != toClaimIngredientProgressList && len(toClaimIngredientProgressList) > 0 {
			deletedIngredientProgressIds, err = models.DeleteReclaimedIngredientProgressList(tx, playerId, toClaimIngredientProgressList)
			if err != nil {
				Logger.Warn("mysql err\n", zap.Any("err:", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}

		_, err = models.CheckMissionCompletionAndAllocateIfApplicable(
			tx,
			playerId,
			preSyncData,
			syncData,
			nil,
			nil,
			models.PlayerIngredientForIdleGameListToMap(prePlayerIngredientForIdleGameList),
			models.PlayerIngredientForIdleGameListToMap(playerIngredientForIdleGameList),
		)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		err = models.UpdatePlayerRecipeStateBySyncData(tx, playerId, syncData)
		if err != nil && err != sql.ErrNoRows {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		playerRecipe, err = models.GetPlayerRecipe(tx, playerId)
		if err != nil {
			Logger.Warn("mysql err\n", zap.Any("err:", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		_ = json.Unmarshal([]byte(req.ToClaimPlayerMissionBindingList), &unclaimedMissionBindingIDs)

		for _, missionBindingID := range unclaimedMissionBindingIDs {
			err = models.UpdateMissionCompleteState(tx, missionBindingID, models.CLAIMED_IN_UPSYNC)
			if err != nil {
				Logger.Warn("mysql err\n", zap.Any("err:", err))
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	marshalData, _ := proto.Marshal(syncData)
	resData := base64.StdEncoding.EncodeToString(marshalData)

	resp := struct {
		Ret                                  int64                                 `json:"ret"`
		SyncData                             string                                `json:"syncData"`
		ReqSeqNum                            int64                                 `json:"reqSeqNum"`
		ShouldRefreshMissionList             bool                                  `json:"shouldRefreshMissionList"`
		NewlyClaimedIngredientProgressList   []int32                               `json:"newlyClaimedIngredientProgressList"`
		NewlyClaimedPlayerMissionBindingList []int32                               `json:"newlyClaimedPlayerMissionBindingList"`
		RecipeList                           []*models.PlayerRecipeResp            `json:"playerRecipeList"`
		NewlyClaimedPurchaseIngredientList   []int32                               `json:"newlyClaimedPurchaseIngredientList"`
		PlayerIngredientForIdleGameList      []*models.PlayerIngredientForIdleGame `json:"playerIngredientForIdleGameList"`
		Announcement                         interface{}                           `json:"announcement"`
	}{
		Constants.RetCode.Ok,
		resData,
		req.ReqSeqNum,
		false, // Hardcoded temporarily. -- YFLu, 2019-09-15
		deletedIngredientProgressIds,
		unclaimedMissionBindingIDs, // Hardcoded temporarily. -- YFLu, 2019-09-15
		playerRecipe,
		toClaimPurchaseIngredientList,
		playerIngredientForIdleGameList,
		Conf.GlobalConf["announcement"],
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerBuildableListQueryReq [begins]. */
type PlayerBuildableListQueryReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
}

func (p *playerController) PlayerBuildableListQuery(c *gin.Context) {
	var req PlayerBuildableListQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	syncData, err := models.GetPlayerBulkSyncDataByID(tx, playerId)
	if err != nil {
		Logger.Info("syncData", zap.Any("err", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	unclaimedMissionBindingIDs, err := models.GetPlayerMissionBindingIDList(tx, playerId, models.COMPLETED_OBTAINED)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	unclaimedRecords, err := models.GetLegalCurrencyPaymentRecordByState(tx, playerId, models.PAYMENT_RECORD_PAID)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientProgressList, err := models.CheckIngredientCompletionOfPlayer(tx, playerId)
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	playerRecipe, err := models.GetPlayerRecipe(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	Logger.Info("player queried from databae, ", zap.Any("playerId", playerId), zap.Any("playerName", player.Name), zap.Any("playerDiamond", player.Diamond))

	playerIngredientForIdleGameList, err := models.GetPlayerIngredientForIdleGameStateByPlayer(tx, playerId)
	if nil != err {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = models.RefreshPlayerDailyMission(tx, playerId)
	if nil != err {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	missions, err := models.GetPlayerMissionListBindingByPlayerId(tx, playerId)
	if err != nil {
		Logger.Warn("Mysql error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		Logger.Warn("mysql err\n", zap.Any("err:", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret                                     int64                                 `json:"ret"`
		SyncData                                string                                `json:"syncData"`
		ReqSeqNum                               int64                                 `json:"reqSeqNum"`
		UnclaimedPlayerMissionBindingList       []int32                               `json:"unclaimedPlayerMissionBindingList"`
		UnclaimedLegalCurrencyPaymentRecordList []*models.LegalCurrencyPaymentRecord  `json:"unclaimedLegalCurrencyPaymentRecordList"`
		IngredientProgressList                  []*models.IngredientProgress          `json:"ingredientProgressList"`
		KnapsackRecordList                      []*models.Knapsack                    `json:"knapsack"`
		RecipeList                              []*models.PlayerRecipeResp            `json:"playerRecipeList"`
		PlayerMissionBindingList                []*models.PlayerMissionBinding        `json:"playerMissionBindingList"`
		Diamond                                 int32                                 `json:"diamond"`
		PlayerIngredientForIdleGameList         []*models.PlayerIngredientForIdleGame `json:"playerIngredientForIdleGameList"`
		InterruptTutorialMask                   string                                `json:"interruptTutorialMask"`
	}{
		Constants.RetCode.Ok,
		syncData.PBEncodedSyncData,
		req.ReqSeqNum,
		unclaimedMissionBindingIDs,
		unclaimedRecords,
		ingredientProgressList,
		knapsackRecordList,
		playerRecipe,
		missions,
		player.Diamond,
		playerIngredientForIdleGameList,
		player.InterruptTutorialMask,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerBuildableListQueryReq [ends]. */

/* GlobalBuildableLevelConfQueryReq [begins]. */
type GlobalBuildableLevelConfQueryReq struct {
	Token string `form:"intAuthToken"`
}

func (p *playerController) GlobalBuildableLevelConfQuery(c *gin.Context) {
	var req GlobalBuildableLevelConfQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	bindings, err := models.GetAllBuildableLevelBinding(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	buildableIngredientInteractionList, err := models.GetAllBuildableIngredientInteractionList(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientList, err := models.QueryAllIngredientList(tx, 0)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resSyncData, _ := proto.Marshal(&pb.BuildableLevelConfStruct{
		LevelConfList:                      bindings,
		BuildableIngredientInteractionList: buildableIngredientInteractionList,
	})

	resp := struct {
		Ret                         int64                `json:"ret"`
		BuildableLevelConf          string               `json:"buildableLevelConf"`
		ExchangeRateOfGoldToDiamond interface{}          `json:"exchangeRateOfGoldToDiamond"`
		ExchangeRateOfTimeToDiamond interface{}          `json:"exchangeRateOfTimeToDiamond"`
		IngredientList              []*models.Ingredient `json:"ingredientList"`
	}{
		Constants.RetCode.Ok,
		base64.StdEncoding.EncodeToString(resSyncData),
		Conf.GlobalConf["exchangeRateOfGoldToDiamond"],
		Conf.GlobalConf["exchangeRateOfTimeToDiamond"],
		ingredientList,
	}

	c.JSON(http.StatusOK, resp)
}

/* GlobalBuildableLevelConfQueryReq [ends]. */

/* PlayerMissionListQueryReq [begins]. */
type PlayerMissionListQueryReq struct {
	Token string `form:"intAuthToken"`
}

func (p *playerController) PlayerMissionListQuery(c *gin.Context) {
	var req PlayerMissionListQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	missions, err := models.GetPlayerMissionListBindingByPlayerId(tx, playerId)
	if err != nil {
		Logger.Warn("Mysql error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		Logger.Warn("Mysql error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret         int64                          `json:"ret"`
		MissionList []*models.PlayerMissionBinding `json:"playerMissionBindingList"`
	}{
		Constants.RetCode.Ok,
		missions,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerMissionListQueryReq [ends]. */

/* PlayerMissionRewardObtainReq [begins]. */
type PlayerMissionRewardObtainReq struct {
	Token                  string `form:"intAuthToken"`
	PlayerMissionBindingId int32  `form:"playerMissionBindingId"`
}

func (p *playerController) PlayerMissionRewardObtain(c *gin.Context) {
	var req PlayerMissionRewardObtainReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	if playerId > 0 {
		tx := storage.MySQLManagerIns.MustBegin()
		defer tx.Rollback()

		canObtain, mission, err := models.CanRewardObtain(tx, req.PlayerMissionBindingId)
		if err != nil {
			Logger.Info("reward", zap.Any("err", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		Logger.Info("reward", zap.Any("mission", mission))

		if canObtain {
			err := models.UpdateMissionCompleteState(tx, mission.ID, models.COMPLETED_OBTAINED)
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}

		unclaimedMissionBindingIDs, err := models.GetPlayerMissionBindingIDList(tx, playerId, models.COMPLETED_OBTAINED)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		unclaimedRecords, err := models.GetLegalCurrencyPaymentRecordByState(tx, playerId, models.PAYMENT_RECORD_PAID)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		err = tx.Commit()
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}

		resp := struct {
			Ret                                     int64                                `json:"ret"`
			UnclaimedPlayerMissionBindingList       []int32                              `json:"unclaimedPlayerMissionBindingList"`
			UnclaimedLegalCurrencyPaymentRecordList []*models.LegalCurrencyPaymentRecord `json:"unclaimedLegalCurrencyPaymentRecordList"`
		}{
			Constants.RetCode.Ok,
			unclaimedMissionBindingIDs,
			unclaimedRecords,
		}

		c.JSON(http.StatusOK, resp)
	}
}

/* PlayerMissionRewardObtainReq [ends]. */

/* PlayerIapDarwinMobileReceiptSubmitReq [begins]. */
type PlayerIapDarwinMobileReceiptSubmitReq struct {
	Token             string `form:"intAuthToken"`
	ReceiptB64Encoded string `form:"receiptB64Encoded"`
}

func (p *playerController) PlayerIapDarwinMobileReceiptSubmit(c *gin.Context) {
	var req PlayerIapDarwinMobileReceiptSubmitReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	records, err := iap.Asn1Decode(req.ReceiptB64Encoded)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	Logger.Info("records", zap.Any("records", records))

	for _, record := range records {
		Logger.Info("record", zap.Any("record", record))
		err = record.AddLegalCurrencyPaymentRecord(tx, playerId)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
	}

	unclaimedMissionBindingIDs, err := models.GetPlayerMissionBindingIDList(tx, playerId, models.COMPLETED_OBTAINED)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	unclaimedRecords, err := models.GetLegalCurrencyPaymentRecordByState(tx, playerId, models.PAYMENT_RECORD_PAID)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = tx.Commit()
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret                                     int64                                `json:"ret"`
		UnclaimedPlayerMissionBindingList       []int32                              `json:"unclaimedPlayerMissionBindingList"`
		UnclaimedLegalCurrencyPaymentRecordList []*models.LegalCurrencyPaymentRecord `json:"unclaimedLegalCurrencyPaymentRecordList"`
	}{
		Constants.RetCode.Ok,
		unclaimedMissionBindingIDs,
		unclaimedRecords,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerIapDarwinMobileReceiptSubmitReq [ends]. */

/* StagePlayerBuildableBindingListQuery [begins]. */
type StagePlayerBuildableBindingListQueryReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
	Stage     int32  `form:"stage"`
}

func (p *playerController) StagePlayerBuildableBindingListQuery(c *gin.Context) {
	var req StagePlayerBuildableBindingListQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	stageId := req.Stage

	Logger.Info("StagePlayerBuildableBindingListQuery, ", zap.Any("playerId", playerId), zap.Any("stageId", stageId))

	confMap := Conf.GlobalConf

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	buildableList, err := models.GetAllBuildables(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	buildableIngredientInteractionList, err := models.GetAllBuildableIngredientInteractionListNonPb(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	ingredientList, err := models.QueryAllIngredientList(tx, 0)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	err = models.DeletePlayerStageCache(tx, playerId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageInitialState, err := models.GetStageInitialStateDataByStageId(tx, stageId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	/*
	  [WARNING]

	  The following commented snippet is a dirty fix to load IdleGame syncData into StageMap.

	  -- YFLu, 2019-10-17.
	*/
	// bulkSyncData, err := models.GetPlayerBulkSyncDataByID(tx, playerId)
	// if err != nil {
	// 	Logger.Warn("MySQL err\n", zap.Any("err:", err))
	// 	c.Set(api.RET, Constants.RetCode.MysqlError)
	// 	return
	// }
	// syncData := &pb.SyncDataStruct{}
	// decoded, _ := base64.StdEncoding.DecodeString(bulkSyncData.PBEncodedSyncData)
	// _ = proto.Unmarshal(decoded, syncData)
	// if err != nil {
	// 	Logger.Warn("MySQL err\n", zap.Any("err:", err))
	// 	c.Set(api.RET, Constants.RetCode.MysqlError)
	// 	return
	// }
	// stageInitialState.SyncData = syncData;

	err = models.InsertPlayerStageCache(tx, playerId, stageInitialState)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	recipeList, err := models.GetAllRecipeList(tx, make([]int, 0))
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	recipeIngredientListMap, err := models.GetAllRecipeIngredientBindingListMap(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	for _, recipe := range recipeList {
		recipe.RecipeIngredientBindingList = recipeIngredientListMap[recipe.Id]
	}

	knapsackRecordList, err := models.GetAllKnapsack(tx, playerId)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageBindingExist, err := models.CheckPlayerStageBindingExist(tx, playerId, stageId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	returnCode := Constants.RetCode.Ok
	if !stageBindingExist {
		returnCode = Constants.RetCode.StageStillLocked
	}

	tx.Commit()

	theBytesOfStageInitialState, marshalErr := proto.Marshal(stageInitialState)
	if marshalErr != nil {
		Logger.Error("Error remarshalling `stageInitialState` in `StagePlayerBuildableBindingListQuery`:", zap.Any("the error", marshalErr), zap.Any("playerId", playerId))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	resp := struct {
		Ret                                int64                                    `json:"ret"`
		ReqSeqNum                          int64                                    `json:"reqSeqNum"`
		BuildableList                      []*models.Buildable                      `json:"buildableList"`
		BuildableIngredientInteractionList []*models.BuildableIngredientInteraction `json:"buildableIngredientInteractionList"`
		IngredientList                     []*models.Ingredient                     `json:"ingredientList"`
		RecipeList                         []*models.Recipe                         `json:"recipeList"`
		KnapsackRecordList                 []*models.Knapsack                       `json:"knapsack"`

		StageInitialState           string      `json:"stageInitialState"`
		ExchangeRateOfGoldToDiamond interface{} `json:"exchangeRateOfGoldToDiamond"`
		ExchangeRateOfTimeToDiamond interface{} `json:"exchangeRateOfTimeToDiamond"`
		Diamond                     int32       `json:"diamond"`
	}{
		returnCode,
		req.ReqSeqNum,
		buildableList,
		buildableIngredientInteractionList,
		ingredientList,
		recipeList,
		knapsackRecordList,
		base64.StdEncoding.EncodeToString(theBytesOfStageInitialState),
		confMap["exchangeRateOfGoldToDiamond"],
		confMap["exchangeRateOfTimeToDiamond"],
		player.Diamond,
	}

	c.JSON(http.StatusOK, resp)
}

/* StagePlayerBuildableBindingListQuery [ends]. */

/* PlayerStageTerminate [begins]. */
type StageTerminateReq struct {
	Token                string `form:"intAuthToken"`
	ReqSeqNum            int64  `form:"reqSeqNum"`
	Stage                int32  `form:"stage"`
	Score                int32  `form:"score"`
	Stars                int32  `form:"stars"`
	ConsumedKnapsackDict string `form:"consumedKnapsackDict"`
}

func (p *playerController) PlayerStageTerminate(c *gin.Context) {
	var req StageTerminateReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))
	stageId := req.Stage

	var toConsumeKnapsackDict map[int32]int
	err = json.Unmarshal([]byte(req.ConsumedKnapsackDict), &toConsumeKnapsackDict)
	if err != nil {
		Logger.Warn("parse dict error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	newStageBinding, err := models.TerminatePlayerStage(tx, playerId, stageId, req.Score, req.Stars)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageBinding, err := models.GetPlayerStageBindingByPlayerAndStage(tx, playerId, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	for ingredientId, count := range toConsumeKnapsackDict {
		_, err = models.DecrementKnapsackRecord(tx, ingredientId, count, playerId)
		if err != nil {
			Logger.Warn("MySQL error \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
	}

	tx.Commit()

	resp := struct {
		Ret                        int64                      `json:"ret"`
		ReqSeqNum                  int64                      `json:"reqSeqNum"`
		Star                       int32                      `json:"star"`
		Diamond                    int32                      `json:"diamond"`
		PlayerStageBinding         *models.PlayerStageBinding `json:"playerStageBinding"`
		UnlockedPlayerStageBinding *models.PlayerStageBinding `json:"unlockedPlayerStageBinding"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		player.Star,
		player.Diamond,
		stageBinding,
		newStageBinding,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerStageTerminate [ends]. */

/* PlayerStageBindingListQuery [begins]. */
type PlayerStageBindingListQueryReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
}

func (p *playerController) PlayerStageBindingListQuery(c *gin.Context) {
	var req PlayerStageBindingListQueryReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	bindingList, err := models.GetPlayerStageBindingByPlayerId(tx, playerId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	diamondAutoFillCount, err := models.CheckDiamondAutoFillFeasibilityAndFillIfPossible(tx, playerId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageList, err := models.GetAllStageInitialState(tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret                       int64                        `json:"ret"`
		ReqSeqNum                 int64                        `json:"reqSeqNum"`
		PlayerStageBindingList    []*models.PlayerStageBinding `json:"playerStageBindingList"`
		Star                      int32                        `json:"star"`
		Diamond                   int32                        `json:"diamond"`
		StageList                 []*models.StageInitialState  `json:"stageList"`
		DiamondAutoFillUpperLimit int32                        `json:"diamondAutoFillUpperLimit"`
		DiamondAutoFillCount      int32                        `json:"diamondAutoFillCount"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		bindingList,
		player.Star,
		player.Diamond,
		stageList,
		player.DiamondAutoFillUpperLimit,
		diamondAutoFillCount,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerStageBindingListQuery [ends]. */

/* PlayerStagePurchaseByDiamond [begins]. */
type PlayerStagePurchaseByDiamondReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
	Stage     int32  `form:"stage"`
}

func (p *playerController) PlayerStagePurchaseByDiamond(c *gin.Context) {
	var req PlayerStagePurchaseByDiamondReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	stage, err := models.GetStageInitialStateDataByStageId(tx, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	canBuyStage, err := models.CheckDiamondRequirementForStagePurchase(tx, playerId, stage.DiamondPrice)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	if !canBuyStage {
		Logger.Warn("Diamond not enough \n")
		c.Set(api.RET, Constants.RetCode.NoEnoughDiamond)
		return
	}

	err = models.PurchaseStageByDiamond(tx, playerId, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageBinding, err := models.GetPlayerStageBindingByPlayerAndStage(tx, playerId, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret                int64                     `json:"ret"`
		ReqSeqNum          int64                     `json:"reqSeqNum"`
		PlayerStageBinding models.PlayerStageBinding `json:"playerStageBinding"`
		Star               int32                     `json:"star"`
		Diamond            int32                     `json:"diamond"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		*stageBinding,
		player.Star,
		player.Diamond,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerStagePurchaseByDiamond [ends]. */

/* PlayerStagePurchaseByStar [begins]. */
type PlayerStagePurchaseByStarReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
	Stage     int32  `form:"stage"`
}

func (p *playerController) PlayerStagePurchaseByStar(c *gin.Context) {
	var req PlayerStagePurchaseByStarReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	stage, err := models.GetStageInitialStateDataByStageId(tx, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	canBuyStage, err := models.CheckStarRequirementForStagePurchase(tx, playerId, stage.StarPrice)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	if !canBuyStage {
		Logger.Warn("Star not enough \n")
		c.Set(api.RET, Constants.RetCode.NoEnoughStar)
		return
	}

	err = models.PurchaseStageByStar(tx, playerId, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	stageBinding, err := models.GetPlayerStageBindingByPlayerAndStage(tx, playerId, req.Stage)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret                int64                     `json:"ret"`
		ReqSeqNum          int64                     `json:"reqSeqNum"`
		PlayerStageBinding models.PlayerStageBinding `json:"playerStageBinding"`
		Star               int32                     `json:"star"`
		Diamond            int32                     `json:"diamond"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		*stageBinding,
		player.Star,
		player.Diamond,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerStagePurchaseByStar [ends]. */

/* PlayerStagePurchaseByStar [begins]. */
type PlayerAdVideoCloseReq struct {
	Token                  string `form:"intAuthToken"`
	ReqSeqNum              int64  `form:"reqSeqNum"`
	WatchedDurationSeconds *int32 `form:"watchedDurationSeconds"`
	TotalDurationSeconds   *int32 `form:"totalDurationSeconds"`
	IsVideoAdvEnded        string `form:"isVideoAdvEnded"`
}

func (p *playerController) PlayerAdVideoClose(c *gin.Context) {
	var req PlayerAdVideoCloseReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	if req.IsVideoAdvEnded == "true" {
		_, err := models.IncrementPlayerHoldings(tx, playerId, models.AD_VIDEO_ENDED_DIAMOND_REWARD, 0)
		if err != nil {
			Logger.Warn("MySQL error \n", zap.Any(":", err))
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
	}

	player, err := models.GetPlayerById(playerId, tx)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret       int64 `json:"ret"`
		ReqSeqNum int64 `json:"reqSeqNum"`
		Diamond   int32 `json:"diamond"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		player.Diamond,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerAdVideoClose [ends]. */

/* PlayerCheckIn [begins]. */
type PlayerCheckInReq struct {
	Token     string `form:"intAuthToken"`
	ReqSeqNum int64  `form:"reqSeqNum"`
}

func (p *playerController) PlayerCheckIn(c *gin.Context) {
	var req PlayerCheckInReq
	err := c.ShouldBindWith(&req, binding.FormPost)

	api.CErr(c, err)
	if err != nil {
		Logger.Warn("req data error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}

	playerId := int32(c.GetInt(api.PLAYER_ID))

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	lastCheckIn, err := models.PlayerCheckIn(tx, playerId)
	if err != nil {
		Logger.Warn("MySQL error \n", zap.Any(":", err))
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}

	tx.Commit()

	resp := struct {
		Ret                   int64 `json:"ret"`
		ReqSeqNum             int64 `json:"reqSeqNum"`
		LastSuccessfulCheckin int64 `json:"lastSuccessfulCheckin"`
	}{
		Constants.RetCode.Ok,
		req.ReqSeqNum,
		lastCheckIn,
	}

	c.JSON(http.StatusOK, resp)
}

/* PlayerCheckIn [ends]. */

/* GlobalCheckInConf [begins]. */
func (p *playerController) GlobalCheckInConf(c *gin.Context) {
	confMap := Conf.GlobalConf

	resp := struct {
		Ret                    int64       `json:"ret"`
		DailyCheckInRewardList interface{} `json:"dailyCheckInRewardList"`
	}{
		Constants.RetCode.Ok,
		confMap["dailyCheckInRewardList"],
	}

	c.JSON(http.StatusOK, resp)
}

/* GlobalCheckInConf [ends]. */
