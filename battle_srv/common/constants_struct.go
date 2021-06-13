package common

type constants struct {
	AuthChannel struct {
		ByteDance        int64 `json:"BYTE_DANCE"`
		DarwinDeviceUUID int64 `json:"DARWIN_DEVICE_UUID"`
		GoogleAuth       int64 `json:"GOOGLE_AUTH"`
		GameCenter       int64 `json:"GameCenter"`
		Sms              int64 `json:"SMS"`
		WechatGame       int64 `json:"WECHAT_GAME"`
		WechatPubsrv     int64 `json:"WECHAT_PUBSRV"`
	} `json:"AUTH_CHANNEL"`
	InitialDiamondPerPlayer int64 `json:"INITIAL_DIAMOND_PER_PLAYER"`
	MagicMissionOpenMap     struct {
		MAP01 int64 `json:"MAP01"`
		MAP02 int64 `json:"MAP02"`
		MAP03 int64 `json:"MAP03"`
	} `json:"MAGIC_MISSION_OPEN_MAP"`
	NotificationType struct {
		Attack     string `json:"ATTACK"`
		Restaurant string `json:"RESTAURANT"`
	} `json:"NOTIFICATION_TYPE"`
	Player struct {
		Diamond                     int64 `json:"DIAMOND"`
		Energy                      int64 `json:"ENERGY"`
		EnergyLimitAdd              int64 `json:"ENERGY_LIMIT_ADD"`
		Gold                        int64 `json:"GOLD"`
		GoldLimitAdd                int64 `json:"GOLD_LIMIT_ADD"`
		IntAuthTokenTTLSeconds      int64 `json:"INT_AUTH_TOKEN_TTL_SECONDS"`
		SmsExpiredSeconds           int64 `json:"SMS_EXPIRED_SECONDS"`
		SmsValidResendPeriodSeconds int64 `json:"SMS_VALID_RESEND_PERIOD_SECONDS"`
	} `json:"PLAYER"`
	RetCode struct {
		AlreadyObtained                                        int64  `json:"ALREADY_OBTAINED"`
		APICallLimitExceeded                                   int64  `json:"API_CALL_LIMIT_EXCEEDED"`
		Duplicated                                             int64  `json:"DUPLICATED"`
		FailedToCreate                                         int64  `json:"FAILED_TO_CREATE"`
		FailedToDelete                                         int64  `json:"FAILED_TO_DELETE"`
		FailedToUpdate                                         int64  `json:"FAILED_TO_UPDATE"`
		ErrSendingSms                             int64  `json:"ERR_SENDING_SMS"`
		IncorrectCaptcha                                       int64  `json:"INCORRECT_CAPTCHA"`
		IncorrectHandle                                        int64  `json:"INCORRECT_HANDLE"`
		IncorrectPassword                                      int64  `json:"INCORRECT_PASSWORD"`
		IncorrectPhoneCountryCode                              int64  `json:"INCORRECT_PHONE_COUNTRY_CODE"`
		IncorrectPhoneNumber                                   int64  `json:"INCORRECT_PHONE_NUMBER"`
		IngredientProgressMaxPerPlayerBuildableBindingExceeded int64  `json:"INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED"`
		IngredientProgressMaxPerPlayerExceeded                 int64  `json:"INGREDIENT_PROGRESS_MAX_PER_PLAYER_EXCEEDED"`
		InsufficientMemToAllocateConnection                    int64  `json:"INSUFFICIENT_MEM_TO_ALLOCATE_CONNECTION"`
		InvalidEmailLiteral                                    int64  `json:"INVALID_EMAIL_LITERAL"`
		InvalidRequestParam                                    int64  `json:"INVALID_REQUEST_PARAM"`
		InvalidToken                                           int64  `json:"INVALID_TOKEN"`
		IsTestAcc                                              int64  `json:"IS_TEST_ACC"`
		LackOfDiamond                                          int64  `json:"LACK_OF_DIAMOND"`
		LackOfEnergy                                           int64  `json:"LACK_OF_ENERGY"`
		LackOfGold                                             int64  `json:"LACK_OF_GOLD"`
		MapNotUnlocked                                         int64  `json:"MAP_NOT_UNLOCKED"`
		MysqlError                                             int64  `json:"MYSQL_ERROR"`
		NewHandleConflict                                      int64  `json:"NEW_HANDLE_CONFLICT"`
		NonexistentAct                                         int64  `json:"NONEXISTENT_ACT"`
		NonexistentRecipe                                      int64  `json:"NONEXISTENT_RECIPE"`
		NonexistentUUIDChannelAuthPair                         int64  `json:"NONEXISTENT_UUID_CHANNEL_AUTH_PAIR"`
		NotImplementedYet                                      int64  `json:"NOT_IMPLEMENTED_YET"`
		NoAssociatedEmail                                      int64  `json:"NO_ASSOCIATED_EMAIL"`
		NoEnoughDiamond                                        int64  `json:"NO_ENOUGH_DIAMOND"`
		NoEnoughStar                                           int64  `json:"NO_ENOUGH_STAR"`
		Ok                                                     int64  `json:"OK"`
		PasswordResetCodeGenerationPerEmailTooFrequently       int64  `json:"PASSWORD_RESET_CODE_GENERATION_PER_EMAIL_TOO_FREQUENTLY"`
		PopulationLimitExceeded                                int64  `json:"POPULATION_LIMIT_EXCEEDED"`
		RecipeNameUnknown                                      int64  `json:"RECIPE_NAME_UNKNOWN"`
		RecipeNotUnlocked                                      int64  `json:"RECIPE_NOT_UNLOCKED"`
		RedisError                                             int64  `json:"REDIS_ERROR"`
		ResearchInProgress                                     int64  `json:"RESEARCH_IN_PROGRESS"`
		SendEmailTimeout                                       int64  `json:"SEND_EMAIL_TIMEOUT"`
		SmsCaptchaNotMatch                                     int64  `json:"SMS_CAPTCHA_NOT_MATCH"`
		SmsCaptchaRequestedTooFrequently                       int64  `json:"SMS_CAPTCHA_REQUESTED_TOO_FREQUENTLY"`
		StageStillLocked                                       int64  `json:"STAGE_STILL_LOCKED"`
		SuccessfulKnownRecipeAndKnownIngredient                int64  `json:"SUCCESSFUL_KNOWN_RECIPE_AND_KNOWN_INGREDIENT"`
		SuccessfulKnownRecipeAndNewIngredient                  int64  `json:"SUCCESSFUL_KNOWN_RECIPE_AND_NEW_INGREDIENT"`
		SuccessfulNewRecipeAndKnownIngredient                  int64  `json:"SUCCESSFUL_NEW_RECIPE_AND_KNOWN_INGREDIENT"`
		SuccessfulNewRecipeAndNewIngredient                    int64  `json:"SUCCESSFUL_NEW_RECIPE_AND_NEW_INGREDIENT"`
		TradeCreationTooFrequently                             int64  `json:"TRADE_CREATION_TOO_FREQUENTLY"`
		UnknownError                                           int64  `json:"UNKNOWN_ERROR"`
		VictimRestaurantIsAttacking                            int64  `json:"VICTIM_RESTAURANT_IS_ATTACKING"`
		VictimRestaurantIsWorking                              int64  `json:"VICTIM_RESTAURANT_IS_WORKING"`
		WechatServerError                                      int64  `json:"WECHAT_SERVER_ERROR"`
		Comment                                                string `json:"__comment__"`
	} `json:"RET_CODE"`
	Ws struct {
		IntervalToPing        int64 `json:"INTERVAL_TO_PING"`
		WillKickIfInactiveFor int64 `json:"WILL_KICK_IF_INACTIVE_FOR"`
	} `json:"WS"`
}
