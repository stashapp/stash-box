package image

import (
	"bytes"
	"os"
	"path/filepath"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type FileBackend struct{}

func (s *FileBackend) WriteFile(file *bytes.Reader, image *models.Image) error {
	fileDir := config.GetImageLocation()
	imagePath := filepath.Join(fileDir, GetImageFileNameFromUUID(image.ID))

	// check fileDir for the identical file
	if exists, _ := utils.FileExists(imagePath); exists {
		// file already exists
		return nil
	}

	outputFile, err := os.OpenFile(imagePath, os.O_WRONLY|os.O_CREATE, os.FileMode(0644))
	if err != nil {
		return nil
	}

	defer outputFile.Close()

	if _, err := file.WriteTo(outputFile); err != nil {
		_ = os.Remove(imagePath)
		return err
	}

	return nil
}

func (s *FileBackend) DestroyFile(image *models.Image) error {
	fileDir := config.GetImageLocation()
	imagePath := filepath.Join(fileDir, GetImageFileNameFromUUID(image.ID))
	return os.Remove(imagePath)
}
