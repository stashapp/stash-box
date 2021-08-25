package image

import (
	"bytes"
	"io/ioutil"
	"os"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type FileBackend struct{}

func (s *FileBackend) WriteFile(file *bytes.Reader, image *models.Image) error {
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

	buf := new(bytes.Buffer)
	if _, err := buf.ReadFrom(file); err != nil {
		return err
	}

	// write the file
	path := GetImagePath(fileDir, image.Checksum)
	if err := ioutil.WriteFile(path, buf.Bytes(), os.FileMode(0644)); err != nil {
		_ = os.Remove(path)
		return err
	}

	return nil
}

func (s *FileBackend) DestroyFile(image *models.Image) error {
	if err := config.ValidateImageLocation(); err != nil {
		return err
	}

	return os.Remove(GetImagePath(config.GetImageLocation(), image.Checksum))
}
