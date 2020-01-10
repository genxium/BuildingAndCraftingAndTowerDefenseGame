package common

import (
	"path/filepath"

	"github.com/imdario/mergo"
	"go.uber.org/zap"
)

// 隐式导入
var Constants *constants

func MustParseConstants() {
	fp := filepath.Join(Conf.General.AppRoot, "common/constants.json")
	if isNotExist(fp) {
		Logger.Fatal("common/constants.json文件不存在")
	}
	Constants = new(constants)
	LoadJSON(fp, Constants)

	Logger.Debug("Conf.General.ServerEnv", zap.String("env", Conf.General.ServerEnv))
	if Conf.General.ServerEnv == SERVER_ENV_TEST {
		fp = filepath.Join(Conf.General.AppRoot, "common/constants_test.json")
		if !isNotExist(fp) {
			testConstants := new(constants)
			LoadJSON(fp, testConstants)
			//Logger.Debug(spew.Sdump(Constants))
			//Logger.Debug(spew.Sdump(testConstants))
			err := mergo.Merge(testConstants, Constants)
			ErrFatal(err)
			Constants = testConstants
			//Logger.Debug("mergo.Merge", zap.Error(err))
			//Logger.Debug(spew.Sdump(testConstants))
		}
	}
	constantsPost()
	// Logger.Debug("const", zap.Int("IntAuthTokenTTLSeconds", Constants.Player.IntAuthTokenTTLSeconds))
}
