package image

import (
	"io"
	"os"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type FileBackend struct{}

func (s *FileBackend) WriteFile(file []byte, image *models.Image) error {
	if err := config.ValidateImageLocation(); err != nil {
		return err
	}

	fileDir := config.GetImageLocation()

	// check fileDir for the identical file
	fn := GetImagePath(fileDir, image.Checksum)
	if exists, _ := utils.FileExists(fn); exists {
		// file already exists
		return nil
	}

	// write the file
	path := GetImagePath(fileDir, image.Checksum)
	if err := os.WriteFile(path, file, os.FileMode(0644)); err != nil {
		_ = os.Remove(path)
		return err
	}

	return nil
}

func (s *FileBackend) DestroyFile(image *models.Image) error {
	return os.Remove(GetImagePath(config.GetImageLocation(), image.Checksum))
}

func (s *FileBackend) ReadFile(image models.Image) (io.ReadCloser, error) {
	fileDir := config.GetImageLocation()
	path := GetImagePath(fileDir, image.Checksum)
	return os.Open(path)
}
