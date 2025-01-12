package image

import (
	"io"

	"github.com/stashapp/stash-box/pkg/models"
)

type Backend interface {
	WriteFile(file []byte, image *models.Image) error
	DestroyFile(image *models.Image) error
	ReadFile(image models.Image) (io.ReadCloser, error)
}
