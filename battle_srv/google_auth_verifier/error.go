package google_auth_verifier

import "errors"

var (
	ErrInvalidToken = errors.New("Invalid token")

	ErrPublicKeyNotFound = errors.New("No public key found for given kid")

	ErrWrongSignature = errors.New("Wrong token signature")

	ErrNoIssueTimeInToken = errors.New("No issue time in token")

	ErrNoExpirationTimeInToken = errors.New("No expiration time in token")

	ErrExpirationTimeTooFarInFuture = errors.New("Expiration time too far in future")

	ErrTokenUsedTooEarly = errors.New("Token used too early")

	ErrTokenUsedTooLate = errors.New("Token used too late")
)
