// nolint: revive
package utils

import (
	"crypto/rand"
	"encoding/ascii85"
	"fmt"
	"strconv"
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

// ParseFingerprintHash converts a fingerprint hash hex string to int64.
func ParseFingerprintHash(hash string) (int64, error) {
	hashUint, err := strconv.ParseUint(hash, 16, 64)
	if err != nil {
		return 0, err
	}
	return int64(hashUint), nil
}
