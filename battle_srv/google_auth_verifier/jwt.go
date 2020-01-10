package google_auth_verifier

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"bytes"

	"fmt"

	"golang.org/x/oauth2/jws"
)

var (
	nowFn = time.Now
)

func parseJWT(token string) (*jws.Header, *ClaimSet, error) {
	s := strings.Split(token, ".")
	if len(s) != 3 {
		return nil, nil, errors.New("Invalid token received")
	}
	decodedHeader, err := base64.RawURLEncoding.DecodeString(s[0])
	if err != nil {
		return nil, nil, err
	}
	header := &jws.Header{}
	err = json.NewDecoder(bytes.NewBuffer(decodedHeader)).Decode(header)
	if err != nil {
		return nil, nil, err
	}
	claimSet, err := Decode(token)
	if err != nil {
		return nil, nil, err
	}
	return header, claimSet, nil
}

// Decode returns ClaimSet
func Decode(token string) (*ClaimSet, error) {
	s := strings.Split(token, ".")
	if len(s) != 3 {
		return nil, ErrInvalidToken
	}
	decoded, err := base64.RawURLEncoding.DecodeString(s[1])
	if err != nil {
		return nil, err
	}
	c := &ClaimSet{}
	err = json.NewDecoder(bytes.NewBuffer(decoded)).Decode(c)
	return c, err
}

// VerifySignedJWTWithCerts is golang port of OAuth2Client.prototype.verifySignedJwtWithCerts
func VerifySignedJWTWithCerts(token string, certs *Certs, allowedAuds []string, issuers []string, maxExpiry time.Duration) error {
	header, claimSet, err := parseJWT(token)
	if err != nil {
		return err
	}
	key := certs.Keys[header.KeyID]
	if key == nil {
		return ErrPublicKeyNotFound
	}
	err = jws.Verify(token, key)
	if err != nil {
		return ErrWrongSignature
	}
	if claimSet.Iat < 1 {
		return ErrNoIssueTimeInToken
	}
	if claimSet.Exp < 1 {
		return ErrNoExpirationTimeInToken
	}
	now := nowFn()
	if claimSet.Exp > now.Unix()+int64(maxExpiry.Seconds()) {
		return ErrExpirationTimeTooFarInFuture
	}

	earliest := claimSet.Iat - int64(ClockSkew.Seconds())
	latest := claimSet.Exp + int64(ClockSkew.Seconds())

	if now.Unix() < earliest {
		return ErrTokenUsedTooEarly
	}

	if now.Unix() > latest {
		return ErrTokenUsedTooLate
	}

	found := false
	for _, issuer := range issuers {
		if issuer == claimSet.Iss {
			found = true
			break
		}
	}
	if !found {
		return fmt.Errorf("Wrong issuer: %s", claimSet.Iss)
	}

	audFound := false
	for _, aud := range allowedAuds {
		if aud == claimSet.Aud {
			audFound = true
			break
		}
	}
	if !audFound {
		return fmt.Errorf("Wrong aud: %s", claimSet.Aud)
	}

	return nil
}
