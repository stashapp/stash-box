package image

import (
	"bytes"
	"io/ioutil"
	"os"

	"github.com/stashapp/stashdb/pkg/manager/config"
	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

type FileBackend struct{}

func (s *FileBackend) WriteFile(file *bytes.Reader, image *models.Image) error {
	fileDir := config.GetImageLocation()

	// check fileDir for the identical file
	fn := GetImagePath(fileDir, image.Checksum)
	if exists, _ := utils.FileExists(fn); exists {
		// file already exists
		return nil
	}

	buf := new(bytes.Buffer)
	buf.ReadFrom(file)

	// write the file
	path := GetImagePath(fileDir, image.Checksum)
	if err := ioutil.WriteFile(path, buf.Bytes(), os.FileMode(0644)); err != nil {
		os.Remove(path)
		return err
	}

	return nil
}

func (s *FileBackend) DestroyFile(image *models.Image) error {
	return os.Remove(GetImagePath(config.GetImageLocation(), image.Checksum))
}
