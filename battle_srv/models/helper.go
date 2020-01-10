package models

import (
	"database/sql"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

func DeleteAll(tx *sqlx.Tx, t string) error {
	query, args, err := sq.Delete(t).ToSql()
	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	return err
}

func exist(t string, cond sq.Eq) (bool, error) {
	c, err := getCount(t, cond)
	if err != nil {
		return false, err
	}
	return c >= 1, nil
}

func txExist(tx *sqlx.Tx, t string, cond sq.Eq) (bool, error) {
	c, err := txGetCount(tx, t, cond)
	if err != nil {
		return false, err
	}
	return c >= 1, nil
}

func txGetCount(tx *sqlx.Tx, t string, cond sq.Eq) (int32, error) {
	query, args, err := sq.Select("count(*)").From(t).Where(cond).ToSql()
	//Logger.Info("txGetCount", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return 0, err
	}
	var c int32
	err = tx.Get(&c, query, args...)
	//Logger.Info("count", zap.Any(":", c))
	return c, err
}

func getCount(t string, cond sq.Eq) (int32, error) {
	query, args, err := sq.Select("count(1)").From(t).Where(cond).ToSql()
	if err != nil {
		return 0, err
	}
	//Logger.Debug("getCount", zap.String("sql", query), zap.Any("args", args))
	var c int32
	err = storage.MySQLManagerIns.Get(&c, query, args...)
	return c, err
}

func GetCount(t string, w string, tx *sqlx.Tx) (int32, error) {
	if tx != nil {
		query, args, err := sq.Select("count(1)").From(t).Where(w).ToSql()
		if err != nil {
			return 0, err
		}
		//Logger.Debug("getCount", zap.String("sql", query), zap.Any("args", args))
		var c int32
		err = tx.Get(&c, query, args...)
		return c, err
	} else {
		query, args, err := sq.Select("count(1)").From(t).Where(w).ToSql()
		if err != nil {
			return 0, err
		}
		//Logger.Debug("getCount", zap.String("sql", query), zap.Any("args", args))
		var c int32
		err = storage.MySQLManagerIns.Get(&c, query, args...)
		return c, err
	}
}

func insert(t string, cols []string, vs []interface{}) (sql.Result, error) {
	query, args, err := sq.Insert(t).Columns(cols...).Values(vs...).ToSql()
	Logger.Debug("txInsert", zap.String("sql", query))
	if err != nil {
		return nil, err
	}
	result, err := storage.MySQLManagerIns.Exec(query, args...)
	return result, err
}

func txInsert(tx *sqlx.Tx, t string, cols []string, vs []interface{}) (sql.Result, error) {
	query, args, err := sq.Insert(t).Columns(cols...).Values(vs...).ToSql()
	Logger.Debug("txInsert", zap.String("sql", query))
	if err != nil {
		return nil, err
	}
	result, err := tx.Exec(query, args...)
	return result, err
}

func getFields(t string, fields []string, cond sq.Eq, dest interface{}) error {
	query, args, err := sq.Select(fields...).From(t).Where(cond).Limit(1).ToSql()
	Logger.Debug("getFields", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	err = storage.MySQLManagerIns.Get(dest, query, args...)
	return err
}

func getObj(t string, cond sq.Eq, dest interface{}) error {
	query, args, err := sq.Select("*").From(t).Where(cond).Limit(1).ToSql()
	Logger.Debug("getObj", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	err = storage.MySQLManagerIns.Get(dest, query, args...)
	return err
}

func txGetObj(tx *sqlx.Tx, t string, cond sq.Eq, dest interface{}) error {
	// TODO:Always use "SELECT ... FOR UPDATE" to obtain an exclusive lock!
	query, args, err := sq.Select("*").From(t).Where(cond).Limit(1).ToSql()
	Logger.Debug("txGetObj", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	err = tx.Get(dest, query, args...)
	return err
}

func GenerateUuid(tx *sqlx.Tx) (*string, error) {
	var dest = new(string)
	query, args, err := sq.Select("uuid()").ToSql()
	Logger.Debug("GenerateUuid", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return nil, err
	}
	err = tx.Get(dest, query, args...)
	return dest, err
}

func txGetObjForUpdate(tx *sqlx.Tx, t string, cond sq.Eq, dest interface{}) error {
	query, args, err := sq.Select("*").From(t).Where(cond).Limit(1).Suffix("for update").ToSql()
	Logger.Debug("txGetObj", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	err = tx.Get(dest, query, args...)
	return err
}

func getList(tx *sqlx.Tx, t string, cond sq.Eq, dest interface{}) error {
	query, args, err := sq.Select("*").From(t).Where(cond).ToSql()
	Logger.Debug("getList", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return err
	}
	if tx == nil {
		err = storage.MySQLManagerIns.Select(dest, query, args...)
	} else {
		err = tx.Select(dest, query, args...)
	}
	return err
}
