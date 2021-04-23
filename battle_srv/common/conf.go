package common

import (
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"os"
	"path/filepath"
	"strings"
)

var Conf *config

const (
	APP_NAME                  = "server"
	SERVER_ENV_PROD           = "PROD"
	SERVER_ENV_TEST           = "TEST"
	SERVER_ENV_ANONYMOUS_TEST = "AnonymousPlayerEnabledTest"
	SERVER_ENV_ANONYMOUS_PROD = "AnonymousPlayerEnabledProd"
)

type generalConf struct {
	AppRoot                     string `json:"-"`
	ConfDir                     string `json:"-"`
	TestEnvSQLitePath           string `json:"-"`
	PreConfSQLitePath           string `json:"-"`
	MailboxTranscriptSqlitePath string `json:"-"`
	ServerEnv                   string `json:"-"`
}

type mysqlConf struct {
	DSN      string `json:"-"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Dbname   string `json:"dbname"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type sioConf struct {
	Port int `json:"port"`
}

type redisConf struct {
	Dbname   int    `json:"dbname"`
	Host     string `json:"host"`
	Password string `json:"password"`
	Port     int    `json:"port"`
}

type WechatConf struct {
	ApiProtocol string `json:"apiProtocol"`
	ApiGateway  string `json:"apiGateway"`
	AppId       string `json:"appId"`
	AppSecret   string `json:"appSecret"`
}

type config struct {
	General        *generalConf
	MySQL          *mysqlConf
	GlobalConf     string
	Sio            *sioConf
	Redis          *redisConf
	GlobalConfEtag *uint32
	WechatGameConf *WechatConf
  IsTest         bool
}

func IsTest () {
}

func MustParseConfig() {
  
	// 初始所有指针数据
	Conf = &config{
		General:        new(generalConf),
		MySQL:          new(mysqlConf),
		Sio:            new(sioConf),
		Redis:          new(redisConf),
		WechatGameConf: new(WechatConf),
    IsTest        : false, // will be updated within this function
	}
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	Logger.Debug("os.GetWd", zap.String("pwd", pwd))
	ErrFatal(err)

	appRoot := pwd
	confDir := filepath.Join(appRoot, "configs")
	Logger.Debug("conf", zap.String("dir", confDir))
	if isNotExist(confDir) {
		appRoot = filepath.Dir(execPath)
		confDir = filepath.Join(appRoot, "configs")
		Logger.Debug("conf", zap.String("dir", confDir))
		if isNotExist(confDir) {
			i := strings.LastIndex(pwd, "battle_srv")
			if i == -1 {
				Logger.Fatal("无法找到配置目录，cp -rn configs.template configs，并配置相关参数，再启动")
			}
			appRoot = pwd[:(i + 10)]
			confDir = filepath.Join(appRoot, "configs")
			Logger.Debug("conf", zap.String("dir", confDir))
			if isNotExist(confDir) {
				Logger.Fatal("无法找到配置目录，cp -rn configs.template configs，并配置相关参数，再启动")
			}
		}
	}
	Conf.General.AppRoot = appRoot
	testEnvSQLitePath := filepath.Join(confDir, "test_env.sqlite")
	if !isNotExist(testEnvSQLitePath) {
		Conf.General.TestEnvSQLitePath = testEnvSQLitePath
	}
	mailboxTranscriptSqlitePath := filepath.Join(confDir, "mailbox_transcript_en_us.sqlite")
	if !isNotExist(mailboxTranscriptSqlitePath) {
		Conf.General.MailboxTranscriptSqlitePath = mailboxTranscriptSqlitePath
	}
	Conf.General.ConfDir = confDir
	Conf.General.ServerEnv = os.Getenv("ServerEnv")

  Conf.IsTest = (SERVER_ENV_TEST == Conf.General.ServerEnv || SERVER_ENV_ANONYMOUS_TEST == Conf.General.ServerEnv)

	var preConfSQLitePath string
	if Conf.IsTest {
		preConfSQLitePath = filepath.Join(confDir, "preconfigured.test.sqlite")
	} else {
		preConfSQLitePath = filepath.Join(confDir, "preconfigured.sqlite")
	}
	if !isNotExist(preConfSQLitePath) {
		Conf.General.PreConfSQLitePath = preConfSQLitePath
	}

	LoadJSON("mysql.json", Conf.MySQL)
	setMySQLDSNURL(Conf.MySQL)
	LoadJSON("sio.json", Conf.Sio)
	LoadJSON("redis.json", Conf.Redis)
	LoadJSON("wechat.json", Conf.WechatGameConf)

	//Logger.Debug(spew.Sdump(Conf))
}

func setMySQLDSNURL(c *mysqlConf) {
	var dsn = fmt.Sprintf("%s:%s@tcp(%s:%d)/%s",
		c.Username, c.Password, c.Host, c.Port, c.Dbname)
	c.DSN = dsn

}

func LoadJSON(fp string, v interface{}) {
	if !filepath.IsAbs(fp) {
		fp = filepath.Join(Conf.General.ConfDir, fp)
	}
	_, err := os.Stat(fp)
	ErrFatal(err)

	fd, err := os.Open(fp)
	ErrFatal(err)
	defer fd.Close()
	Logger.Info("open file successfully", zap.String("fp", fp))
	err = json.NewDecoder(fd).Decode(v)
	ErrFatal(err)
	Logger.Info("load json successfully", zap.String("fp", fp))
}

// 启动过程可以使用，运行时不准使用
func ErrFatal(err error) {
	if err != nil {
		Logger.Fatal("ErrFatal", zap.NamedError("err", err))
	}
}

func isNotExist(p string) bool {
	if _, err := os.Stat(p); err != nil {
		return true
	}
	return false
}
