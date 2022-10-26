package urlbuilders

import (
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type S3ImageURLBuilder struct {
	Image *models.Image
}

func NewS3ImageURLBuilder(image *models.Image) S3ImageURLBuilder {
	return S3ImageURLBuilder{
		Image: image,
	}
}

func (b S3ImageURLBuilder) GetImageURL() string {
	config := config.GetS3Config()
	return config.BaseURL + "/" + image.GetImageFileNameFromUUID(b.Image.ID)
}
