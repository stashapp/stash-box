package image

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type ImageService interface {
	Create(input models.ImageCreateInput) (*models.Image, error)
	Destroy(input models.ImageDestroyInput) error
	DestroyUnusedImages() error
	DestroyUnusedImage(imageID uuid.UUID) error
}

func GetService(repo models.ImageRepo) ImageService {
	imageBackend := config.GetImageBackend()

	var backend ImageBackend
	if imageBackend == config.FileBackend {
		backend = &FileBackend{}
	} else if imageBackend == config.S3Backend {
		backend = &S3Backend{}
	}

	return &Service{
		Repository: repo,
		Backend:    backend,
	}
}
