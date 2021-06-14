package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"server/api"
	"server/api/v1"
	. "server/common"
	"server/env_tools"
	// "server/iap"
	"server/scheduler"
	"server/storage"
	wechatVerifier "server/wechat"
	"server/ws"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/robfig/cron"
	"go.uber.org/zap"
)

func main() {
	// 加载所有配置
	MustParseConfig()
	MustParseConstants()

	// 存储相关初始化
	storage.Init()
	wechatVerifier.Init()

	// iap.InitTrustedCertManager()
	env_tools.LoadPreConf()
	env_tools.LoadMailboxTranscript()
	if Conf.IsTest {
		env_tools.MergeTestPlayerAccounts()
	}
	startScheduler()
	var router *gin.Engine
	if SERVER_ENV_ANONYMOUS_PROD == Conf.General.ServerEnv || SERVER_ENV_PROD == Conf.General.ServerEnv {
		// Disables the default logger of each query.
		router = gin.New()
	} else {
		router = gin.Default()
	}
	setRouter(router)
	Logger.Info("Listening and serving HTTP on", zap.Int("Conf.Sio.Port", Conf.Sio.Port))
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", Conf.Sio.Port),
		Handler: router,
	}
	srv.SetKeepAlivesEnabled(false)
	go func() {
		// service connections
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			Logger.Fatal("listen: %s\n", zap.Error(err))
		}
	}()
	var gracefulStop = make(chan os.Signal)
	signal.Notify(gracefulStop, syscall.SIGTERM)
	signal.Notify(gracefulStop, syscall.SIGINT)
	sig := <-gracefulStop
	Logger.Info("Shutdown Server ...")
	Logger.Info("caught sig", zap.Any("sig", sig))
	Logger.Info("Wait for 5 second to finish processing")
	clean()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		Logger.Fatal("Server Shutdown:", zap.Error(err))
	}
	Logger.Info("Server exiting")
	os.Exit(0)
}

func clean() {
	Logger.Info("start clean")
	if storage.MySQLManagerIns != nil {
		storage.MySQLManagerIns.Close()
	}
	if Logger != nil {
		Logger.Sync()
	}
}

func setRouter(router *gin.Engine) {
	f := func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ping": "pong"})
	}
	router.Use(cors.Default())
	router.StaticFS("/asset", http.Dir(filepath.Join(Conf.General.AppRoot, "asset")))
	router.GET("/ping", f)
	router.GET("/cuisineconn", ws.Serve)

	globalRouter := router.Group("/api/v1/Global")
	{
		globalRouter.GET("/AuthConf/Query", v1.Player.GlobalConfRead)
		globalRouter.POST("/BuildableLevelConf/Query", v1.Player.GlobalBuildableLevelConfQuery)
		globalRouter.POST("/CheckInConf/Query", v1.Player.GlobalCheckInConf)
	}

	playerRouter := router.Group("/api/v1/Player")
	{
		playerRouter.Use(api.HandleRet(), api.RequestLogger())
		playerRouter.GET("/SmsCaptcha/Obtain", v1.Player.SmsCaptchaObtain)
		playerRouter.POST("/IntAuthToken/Login", v1.Player.IntAuthTokenLogin)
		playerRouter.POST("/IntAuthToken/Logout", v1.Player.IntAuthTokenLogout)
		playerRouter.POST("/GoogleAuth/Login", v1.Player.GoogleAuthLogin)
		playerRouter.POST("/SmsCaptcha/Login", v1.Player.SMSCaptchaLogin)
		playerRouter.POST("/GameCenter/Login", v1.Player.GameCenterLogin)
		playerRouter.POST("/WechatGame/Login", v1.Player.WechatGameLogin)
		playerRouter.POST("/Anonymous/ByteDance/Login", v1.Player.AnonymousByteDanceLogin)

		if Conf.General.ServerEnv == SERVER_ENV_ANONYMOUS_PROD || Conf.General.ServerEnv == SERVER_ENV_ANONYMOUS_TEST {
			//游客登录API仅在(true == ServerEnv.AnonymousPlayerEnabled)才允许访问
			playerRouter.POST("/Anonymous/Darwin/Uuid/Login", v1.Player.AnonymousLogin)
		}

		authRouter := func(method string, url string, handler gin.HandlerFunc) {
			playerRouter.Handle(method, url, v1.Player.TokenWithPlayerIdAuth, handler)
		}
		authRouter(http.MethodPost, "/Iap/Receipt/Submit", v1.Player.PlayerIapReceiptSubmit)

		simpleAuthRouter := func(method string, url string, handler gin.HandlerFunc) {
			playerRouter.Handle(method, url, v1.Player.TokenAuth, v1.Player.CallLimitController, handler)
		}
		simpleAuthRouter(http.MethodPost, "/MySQL/SyncData/Upsync", v1.Player.PlayerSyncData)
		simpleAuthRouter(http.MethodPost, "/BuildableList/Query", v1.Player.PlayerBuildableListQuery)
		simpleAuthRouter(http.MethodPost, "/MissionList/Query", v1.Player.PlayerMissionListQuery)
		simpleAuthRouter(http.MethodPost, "/MissionReward/Obtain", v1.Player.PlayerMissionRewardObtain)
		simpleAuthRouter(http.MethodPost, "/Iap/DarwinMobile/Receipt/Submit", v1.Player.PlayerIapDarwinMobileReceiptSubmit)
		simpleAuthRouter(http.MethodPost, "/Ingredient/Produce", v1.Player.PlayerIngredientProduce)
		simpleAuthRouter(http.MethodPost, "/Knapsack/Query", v1.Player.KnapsackQuery)
		simpleAuthRouter(http.MethodPost, "/Knapsack/Synthesize", v1.Player.KnapsackSynthesize)
		simpleAuthRouter(http.MethodPost, "/Knapsack/Reclaim", v1.Player.PlayerIngredientReclaim)
		simpleAuthRouter(http.MethodPost, "/IngredientProgress/Cancel", v1.Player.PlayerIngredientProgressCancel)
		simpleAuthRouter(http.MethodPost, "/PlayerBuildableBinding/IngredientList/Query", v1.Player.PlayerBuildableBindingIngredientListQuery)
		simpleAuthRouter(http.MethodPost, "/PlayerBuildableBinding/Ingredient/Collect", v1.Player.PlayerBuildableBindingIngredientCollect)
		simpleAuthRouter(http.MethodPost, "/IngredientProgress/Boosting", v1.Player.PlayerIngredientProgressBoosting)
		simpleAuthRouter(http.MethodPost, "/Stage/Terminate", v1.Player.PlayerStageTerminate)
		simpleAuthRouter(http.MethodPost, "/PlayerStageBinding/List/Query", v1.Player.PlayerStageBindingListQuery)
		simpleAuthRouter(http.MethodPost, "/PlayerStage/Purchase/Diamond", v1.Player.PlayerStagePurchaseByDiamond)
		simpleAuthRouter(http.MethodPost, "/PlayerStage/Purchase/Star", v1.Player.PlayerStagePurchaseByStar)
		simpleAuthRouter(http.MethodPost, "/AdVideo/Close", v1.Player.PlayerAdVideoClose)
		simpleAuthRouter(http.MethodPost, "/CheckIn", v1.Player.PlayerCheckIn)

		stageBasedSimpleAuthRouter := func(method string, url string, handler gin.HandlerFunc) {
			playerRouter.Handle(method, url, v1.Player.TokenAuth, handler)
		}
		stageBasedSimpleAuthRouter(http.MethodPost, "/StagePlayerBuildableBinding/List/Query", v1.Player.StagePlayerBuildableBindingListQuery)
	}
}

func startScheduler() {
	go func() {
		scheduler.HandleExpiredPlayerLoginToken()
	}()
	c := cron.New()
	c.AddFunc("0 */30 * * * *", scheduler.HandleExpiredPlayerLoginToken)
	c.Start()
}
