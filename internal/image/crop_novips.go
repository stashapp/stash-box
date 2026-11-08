//go:build !unix

package image

import "github.com/stashapp/stash-box/internal/models"

func crop(data []byte, c models.ImageCropInput) ([]byte, error) {
	return cropFallback(data, c)
}
