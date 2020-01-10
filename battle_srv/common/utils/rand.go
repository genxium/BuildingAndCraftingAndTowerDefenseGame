package utils

import (
	crypto_rand "crypto/rand"
	"encoding/hex"
	"math/rand"
	"time"
)

var Rand *privateRand

type privateRand struct {
	*rand.Rand
}

func init() {
	Rand = &privateRand{rand.New(rand.NewSource(time.Now().UnixNano()))}
}

func (p *privateRand) Number(numberRange ...int) int {
	nr := 0
	if len(numberRange) > 1 {
		nr = 1
		nr = p.Intn(numberRange[1]-numberRange[0]) + numberRange[0]
	} else {
		nr = p.Intn(numberRange[0])
	}
	return nr
}

func TokenGenerator(len int) string {
	b := make([]byte, len/2)
	crypto_rand.Read(b)
	return hex.EncodeToString(b)
}
