package common

import (
	"path/filepath"

	"github.com/imdario/mergo"
	"go.uber.org/zap"
)

var Constants *constants

func MustParseConstants() {
	fp := filepath.Join(Conf.General.AppRoot, "common/constants.json")
	if isNotExist(fp) {
		Logger.Fatal("common/constants.json文件不存在")
	}
	Constants = new(constants)
	LoadJSON(fp, Constants)

	Logger.Debug("Conf.General.ServerEnv", zap.String("env", Conf.General.ServerEnv))
	if Conf.IsTest {
		fp = filepath.Join(Conf.General.AppRoot, "common/constants_test.json")
		if !isNotExist(fp) {
			testConstants := new(constants)
			LoadJSON(fp, testConstants)
			err := mergo.Merge(testConstants, Constants)
			ErrFatal(err)
			Constants = testConstants
		}
	}
	// Logger.Debug("const", zap.Int("IntAuthTokenTTLSeconds", Constants.Player.IntAuthTokenTTLSeconds))
}
