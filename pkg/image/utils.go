package image

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"image"
	_ "image/gif"
	"io"
	"path/filepath"

	_ "golang.org/x/image/webp"

	"github.com/stashapp/stash-box/pkg/models"
)

var ErrImageZeroSize = errors.New("image has 0px dimension")

func populateImageDimensions(imgReader *bytes.Reader, dest *models.Image) error {
	// reset to start
	if _, err := imgReader.Seek(0, 0); err != nil {
		return err
	}

	img, _, err := image.Decode(imgReader)
	if err != nil {
		return err
	}

	dest.Width = int64(img.Bounds().Max.X)
	dest.Height = int64(img.Bounds().Max.Y)

	if dest.Width == 0 || dest.Height == 0 {
		return ErrImageZeroSize
	}

	return nil
}

func calculateChecksum(file io.ReadSeeker) (string, error) {
	// reset to start
	if _, err := file.Seek(0, 0); err != nil {
		return "", err
	}

	hasher := md5.New()
	if _, err := io.Copy(hasher, file); err != nil {
		return "", err
	}
	checksum := hex.EncodeToString(hasher.Sum(nil))
	return checksum, nil
}

func GetImagePath(imageDir string, checksum string) string {
	return filepath.Join(imageDir, checksum)
}
