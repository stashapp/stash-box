package image

import (
	"bytes"

	"github.com/stashapp/stash-box/pkg/models"
)

type Backend interface {
	WriteFile(file *bytes.Reader, image *models.Image) error
	DestroyFile(image *models.Image) error
}
