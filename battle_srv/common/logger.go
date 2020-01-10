package common

import (
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// 隐式导入
var Logger *zap.Logger
var LoggerConfig zap.Config

func init() {
	LoggerConfig = zap.NewDevelopmentConfig()
	LoggerConfig.Level.SetLevel(zap.InfoLevel)
	LoggerConfig.Development = false
	LoggerConfig.Sampling = &zap.SamplingConfig{
		Initial:    100,
		Thereafter: 100,
	}
	LoggerConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	var err error
	Logger, err = LoggerConfig.Build()
	ErrFatal(err)
}
