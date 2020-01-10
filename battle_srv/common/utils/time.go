package utils

import "time"

const iapTimeLayout = "2019-02-02T14:30:58Z"

func UnixtimeMilli() int64 {
	return time.Now().UnixNano() / 1000000
}
func UnixtimeSec() int64 {
	return time.Now().Unix()
}

func ParseIapPurchaseDate(str string) (int64, error) {
	t, err := time.Parse(iapTimeLayout, str)
	if err != nil {
		return 0, err
	}
	return t.UnixNano() / 1000000, nil
}
