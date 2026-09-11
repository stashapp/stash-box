package storage

import (
	"io"
	"os"
	"path/filepath"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type FileBackend struct{}

func (s *FileBackend) WriteFile(file []byte, image *models.Image) error {
	if err := config.ValidateImageLocation(); err != nil {
		return err
	}

	fileDir := config.GetImageLocation()

	path := GetImagePath(fileDir, image.ID.String())
	if exists, _ := utils.FileExists(path); exists {
		return nil
	}

	if err := os.MkdirAll(filepath.Dir(path), os.FileMode(0755)); err != nil {
		return err
	}

	if err := os.WriteFile(path, file, os.FileMode(0644)); err != nil {
		_ = os.Remove(path)
		return err
	}

	return nil
}

func (s *FileBackend) DestroyFile(image *models.Image) error {
	return os.Remove(GetImagePath(config.GetImageLocation(), image.ID.String()))
}

func (s *FileBackend) ReadFile(image models.Image) (io.ReadCloser, int64, error) {
	fileDir := config.GetImageLocation()
	path := GetImagePath(fileDir, image.ID.String())
	file, err := os.Open(path)
	if err != nil {
		return nil, 0, err
	}
	stat, err := file.Stat()
	if err != nil {
		file.Close()
		return nil, 0, err
	}
	return file, stat.Size(), nil
}

func GetImagePath(imageDir string, id string) string {
	return filepath.Join(imageDir, shardedKey(id))
}
