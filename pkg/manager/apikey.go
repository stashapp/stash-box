package manager

import (
	"time"

	"github.com/dgrijalva/jwt-go"

	"github.com/stashapp/stashdb/pkg/manager/config"
)

const APIKeySubject = "APIKey"

type APIKeyClaims struct {
	UserID string `json:"uid"`
	jwt.StandardClaims
}

func GenerateAPIKey(userID string) (string, error) {
	claims := &APIKeyClaims{
		UserID: userID,
		StandardClaims: jwt.StandardClaims{
			Subject:  APIKeySubject,
			IssuedAt: time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	ss, err := token.SignedString([]byte(config.GetJWTSignKey()))
	if err != nil {
		return "", err
	}

	return ss, nil
}
