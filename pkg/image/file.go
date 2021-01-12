package image

import (
	"image"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"

	_ "image/jpeg"
	_ "image/png"
)

func GetImagePath(imageDir string, checksum string) string {
	return filepath.Join(imageDir, checksum)
}

func saveFile(fileDir string, file graphql.Upload) (string, error) {
	// save the file from the file to a temporary file so we can get the
	// checksum
	f, err := ioutil.TempFile(fileDir, "temp")
	if err != nil {
		return "", err
	}

	if _, err := io.Copy(f, file.File); err != nil {
		os.Remove(f.Name())
		return "", err
	}

	f.Close()

	checksum, err := utils.MD5FromFilePath(f.Name())
	if err != nil {
		os.Remove(f.Name())
		return "", err
	}

	// check fileDir for the identical file
	fn := GetImagePath(fileDir, checksum)
	if exists, _ := utils.FileExists(fn); exists {
		// remove the temp file and just return the existing checksum
		os.Remove(f.Name())
		return checksum, nil
	}

	// rename the temporary file to the checksum
	if err := os.Rename(f.Name(), fn); err != nil {
		os.Remove(f.Name())
		return "", err
	}

	return checksum, nil
}

func populateImageDimensions(fn string, dest *models.Image) error {
	f, err := os.Open(fn)
	if err != nil {
		return err
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		return err
	}

	dest.Width = int64(img.Bounds().Max.X)
	dest.Height = int64(img.Bounds().Max.Y)

	return nil
}
