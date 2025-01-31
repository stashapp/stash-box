//go:build windows || darwin

package image

import (
	"io"

	"github.com/stashapp/stash-box/pkg/models"
)

func Resize(reader io.Reader, max int, dbimage *models.Image, fileSize int64) ([]byte, error) {
	return resizeImage(reader, int64(max))
}

func InitResizer() {}
