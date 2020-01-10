package common

import (
	"regexp"
	"time"
)

var (
	RE_PHONE_NUM        = regexp.MustCompile(`^\+?[0-9]{8,14}$`)
	RE_CHINA_PHONE_NUM  = regexp.MustCompile(`^(13[0-9]|14[5|7]|15[0|1|2|3|5|6|7|8|9]|18[0|1|2|3|5|6|7|8|9])\d{8}$`)
	RE_SMS_CAPTCHA_CODE = regexp.MustCompile(`^[0-9]{4}$`)
	RE_EMAIL            = regexp.MustCompile(`^[A-Za-z0-9\\u4e00-\\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$`)
)

// 隐式导入
var ConstVals = &struct {
	Player struct {
		CaptchaExpire time.Duration
		CaptchaMaxTTL time.Duration
	}
	Ws struct {
		WillKickIfInactiveFor time.Duration
	}
}{}

func constantsPost() {
	ConstVals.Player.CaptchaExpire = time.Duration(Constants.Player.SmsExpiredSeconds) * time.Second
	ConstVals.Player.CaptchaMaxTTL = ConstVals.Player.CaptchaExpire -
		time.Duration(Constants.Player.SmsValidResendPeriodSeconds)*time.Second

	ConstVals.Ws.WillKickIfInactiveFor = time.Duration(Constants.Ws.WillKickIfInactiveFor) * time.Millisecond
}
