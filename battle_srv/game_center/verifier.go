package game_center

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"fmt"
	"server/inet"
	"strconv"
)

func VerifySig(sSig, sGcId, sBundleId, sSalt, sTimeStamp string, cert []byte) (err error) {
	sig, err := base64.StdEncoding.DecodeString(sSig)
	if err != nil {
		fmt.Printf("Error while decoding the b64encoded signature %v: %+v\n", sSig, err)
		return err
	}
	salt, err := base64.StdEncoding.DecodeString(sSalt)
	if err != nil {
		fmt.Printf("Error while decoding the b64encoded salt %v: %+v\n", sSalt, err)
		return err
	}
	timeStamp, err := strconv.ParseUint(sTimeStamp, 10, 64)
	if err != nil {
		return err
	}

	payload := new(bytes.Buffer)
	payload.WriteString(sGcId)
	payload.WriteString(sBundleId)
	binary.Write(payload, binary.BigEndian, timeStamp)
	payload.Write(salt)

	return inet.VerifyRsa(cert, sig, payload.Bytes())
}
