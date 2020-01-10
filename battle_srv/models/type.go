package models

import (
	"database/sql"
	"encoding/json"
)

type NullInt64 struct {
	sql.NullInt64
}

func NewNullInt64(s int64) NullInt64 {
	ns := NullInt64{}
	ns.Int64 = s
	ns.Valid = true
	return ns
}

func (v NullInt64) MarshalJSON() ([]byte, error) {
	if v.Valid {
		return json.Marshal(v.Int64)
	} else {
		return json.Marshal(nil)
	}
}

func (v *NullInt64) UnmarshalJSON(data []byte) error {
	var s *int64
	//Logger.Debugf("%s\n", data)
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if s != nil {
		v.Valid = true
		v.Int64 = *s
	} else {
		v.Valid = false
	}
	return nil
}

type NullString struct {
	sql.NullString
}

func NewNullString(s string) NullString {
	ns := NullString{}
	ns.String = s
	ns.Valid = true
	return ns
}

func (v NullString) MarshalJSON() ([]byte, error) {
	if v.Valid {
		return json.Marshal(v.String)
	} else {
		return json.Marshal(nil)
	}
}

func (v *NullString) UnmarshalJSON(data []byte) error {
	var s *string
	//Logger.Debugf("%s\n", data)
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	if s != nil {
		v.Valid = true
		v.String = *s
	} else {
		v.Valid = false
	}
	return nil
}
