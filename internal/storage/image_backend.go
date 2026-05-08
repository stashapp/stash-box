package storage

import (
	"io"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
)

func shardedKey(id string) string {
	return id[0:2] + "/" + id[2:4] + "/" + id
}

type Backend interface {
	WriteFile(file []byte, image *models.Image) error
	DestroyFile(image *models.Image) error
	ReadFile(image models.Image) (io.ReadCloser, int64, error)
}

func Image() Backend {
	imageBackend := config.GetImageBackend()

	var backend Backend
	switch imageBackend {
	case config.FileBackend:
		backend = &FileBackend{}
	case config.S3Backend:
		backend = &S3Backend{}
	}

	return backend
}
