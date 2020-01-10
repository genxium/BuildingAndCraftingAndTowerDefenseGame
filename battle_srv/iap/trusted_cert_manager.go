package iap

import (
	"crypto/x509"
	"fmt"
	"server/inet"
)

var (
	TrustedCertManagerIns *TrustedCertManager
)

type TrustedCertManager struct {
	AppleRootCertPool *x509.CertPool
}

func InitTrustedCertManager() {
	trustedAppleRootCertBytes := inet.DownloadCert("https://www.apple.com/appleca/AppleIncRootCertificate.cer")
	trustedAppleRootCert, err := x509.ParseCertificate(trustedAppleRootCertBytes)
	if nil != err {
		panic(err)
	}

	appleRootCertPool := x509.NewCertPool()
	appleRootCertPool.AddCert(trustedAppleRootCert)

	TrustedCertManagerIns = &TrustedCertManager{
		AppleRootCertPool: appleRootCertPool,
	}

	fmt.Println("TrustedCertManagerIns initialized.")
}
