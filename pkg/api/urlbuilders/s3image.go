package urlbuilders

import (
	"crypto/md5"
	"encoding/hex"

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

	if b.Image.Width > config.MaxDimension || b.Image.Height > config.MaxDimension {
		hash := md5.Sum([]byte(b.Image.ID.String() + "-resized"))
		id := hex.EncodeToString(hash[:])
		return config.BaseURL + "/" + id[0:2] + "/" + id[2:4] + "/" + id
	} else {
		id := b.Image.ID.String()
		return config.BaseURL + "/" + id[0:2] + "/" + id[2:4] + "/" + id
	}
}
