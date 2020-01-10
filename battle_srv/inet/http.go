package inet

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
)

func HttpGet(fullUrl string) (content []byte, err error) {
	resp, err := http.Get(fullUrl)
	if err != nil {
		fmt.Printf("url can not be reached %s,%s", fullUrl, err)
		return
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("ERROR_STATUS_NOT_OK")
	}
	body := resp.Body
	content, err = ioutil.ReadAll(body)
	if err != nil {
		fmt.Printf("url read error %s, %s", fullUrl, err)
		return
	}
	body.Close()
	return
}

func DownloadCert(url string) []byte {
	b, err := HttpGet(url)
	if err != nil {
		fmt.Printf("Http request error %s", err)
		return nil
	}
	return b
}

func VerifyRsa(key, sig, content []byte) error {
	cert, err := x509.ParseCertificate(key)
	if err != nil {
		fmt.Printf("Parse cert error %s\n", err)
		return err
	}
	pub := cert.PublicKey.(*rsa.PublicKey)

	h := sha256.New()
	h.Write(content)
	digest := h.Sum(nil)

	err = rsa.VerifyPKCS1v15(pub, crypto.SHA256, digest, sig)
	return err
}
