package image

import (
	"io"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
)

type BackendService interface {
	Create(input models.ImageCreateInput) (*models.Image, error)
	Destroy(input models.ImageDestroyInput) error
	DestroyUnusedImages() error
	DestroyUnusedImage(imageID uuid.UUID) error
	Read(image models.Image) (io.ReadCloser, error)
}

func GetService(repo models.ImageRepo) BackendService {
	imageBackend := config.GetImageBackend()

	var backend Backend
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
