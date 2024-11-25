//go:build windows || darwin

package image

import (
	"io"
)

func Resize(reader io.Reader, max int) ([]byte, error) {
	return resizeImage(reader, int64(max))
}

func InitResizer() {}
