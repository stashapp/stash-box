// nolint: revive
package utils

import (
	"crypto/rand"
	"encoding/ascii85"
	"fmt"
)

func GenerateRandomPassword(l int) (string, error) {
	b := make([]byte, l)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	output := make([]byte, ascii85.MaxEncodedLen(l))
	n := ascii85.Encode(output, b)
	output = output[0:n]
	return string(output), nil
}

func GenerateRandomKey(l int) (string, error) {
	b := make([]byte, l)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", b), nil
}
