package api

import (
	"bytes"
	"encoding/json"
	"go.uber.org/zap"
	"hash/crc32"
	"os"
	"path/filepath"
	. "server/common"
	"server/storage"
	"sync/atomic"
)

func LoadGlobalConfFromJsonFile() {
	Conf.GlobalConfEtag = new(uint32)
	fp := "global_conf.json"
	if !filepath.IsAbs(fp) {
		fp = filepath.Join(Conf.General.ConfDir, fp)
	}
	_, err := os.Stat(fp)
	ErrFatal(err)

	fd, err := os.Open(fp)
	ErrFatal(err)
	defer fd.Close()
	Logger.Info("open file successfully", zap.String("fp", fp))
	var v map[string]interface{}
	err = json.NewDecoder(fd).Decode(&v)
	ErrFatal(err)
	conf, err := json.Marshal(v)
	ErrFatal(err)
	cmdRes := storage.RedisManagerIns.SetNX("/cuisine/conf", conf, 0)
	if nil != cmdRes.Err() {
		ErrFatal(cmdRes.Err())
	}
	if !cmdRes.Val() {
		newConf, err := storage.RedisManagerIns.Get("/cuisine/conf").Bytes()
		if nil != err {
			ErrFatal(err)
		}
		etag := crc32.ChecksumIEEE(conf)
		newEtag := crc32.ChecksumIEEE(newConf)
		if etag != newEtag {
			WriteGlobalConf(fp, newConf)
		}
		atomic.StoreUint32(Conf.GlobalConfEtag, newEtag)
	} else {
		conf, err := storage.RedisManagerIns.Get("/cuisine/conf").Bytes()
		if nil != err {
			ErrFatal(err)
		}
		atomic.StoreUint32(Conf.GlobalConfEtag, crc32.ChecksumIEEE([]byte(conf)))
	}

	Logger.Info("load json successfully", zap.String("fp", fp))
}

func LoadGlobalConfMap() (map[string]interface{}, error) {
	conf, err := storage.RedisManagerIns.Get("/cuisine/conf").Bytes()
	if nil != err {
		return nil, err
	}
	var confMap map[string]interface{}
	err = json.Unmarshal(conf, &confMap)
	if nil != err {
		return nil, err
	}
	newEtag := crc32.ChecksumIEEE(conf)
	if atomic.LoadUint32(Conf.GlobalConfEtag) != newEtag {
		storage.RedisManagerIns.Set("/cuisine/conf", conf, 0)
		WriteGlobalConf("global_conf.json", conf)
		atomic.StoreUint32(Conf.GlobalConfEtag, newEtag)
	}

	return confMap, nil
}

func WriteGlobalConf(fp string, newConf []byte) {
	if !filepath.IsAbs(fp) {
		fp = filepath.Join(Conf.General.ConfDir, fp)
	}
	_, err := os.Stat(fp)
	if nil != err {
		LogErr(err)
	}

	fd, err := os.OpenFile(fp, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0666)
	if nil != err {
		LogErr(err)
	}
	defer fd.Close()
	Logger.Info("open file successfully", zap.String("fp", fp))
	if nil != err {
		LogErr(err)
	}
	var toFileData bytes.Buffer
	err = json.Indent(&toFileData, newConf, "", "\t")
	if nil != err {
		LogErr(err)
	}
	_, err = fd.Write(toFileData.Bytes())
	if nil != err {
		LogErr(err)
	}
	Logger.Info("write json successfully", zap.String("fp", fp))
}

func LogErr(err error) {
	if err != nil {
		Logger.Error("Error", zap.NamedError("err", err))
	}
}
