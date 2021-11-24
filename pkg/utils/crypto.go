package utils

import (
	"crypto/md5"
	"crypto/rand"
	"encoding/ascii85"
	"fmt"
	"io"
	"os"
)

func MD5FromBytes(data []byte) string {
	result := md5.Sum(data)
	return fmt.Sprintf("%x", result)
}

func MD5FromString(str string) string {
	data := []byte(str)
	return MD5FromBytes(data)
}

func MD5FromFilePath(filePath string) (string, error) {
	f, err := os.Open(filePath)
	if err != nil {
		return "", err
	}

	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	checksum := h.Sum(nil)

	_ = f.Close()
	return fmt.Sprintf("%x", checksum), nil
}

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
