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

	issvg "github.com/h2non/go-is-svg"

	"github.com/stashapp/stash-box/pkg/models"
)

var ErrImageZeroSize = errors.New("image has 0px dimension")

func populateImageDimensions(imgReader *bytes.Reader, dest *models.Image) error {
	img, _, err := image.Decode(imgReader)
	if err != nil {
		// SVG is not an image so we have to manually check if the image is SVG
		if _, readerErr := imgReader.Seek(0, 0); readerErr != nil {
			return readerErr
		}
		buf := new(bytes.Buffer)
		if _, bufErr := buf.ReadFrom(imgReader); bufErr != nil {
			return bufErr
		}
		if issvg.IsSVG(buf.Bytes()) {
			dest.Width = -1
			dest.Height = -1
			return nil
		}

		return err
	}

	dest.Width = int64(img.Bounds().Max.X)
	dest.Height = int64(img.Bounds().Max.Y)

	if dest.Width == 0 || dest.Height == 0 {
		return ErrImageZeroSize
	}

	return nil
}

func calculateChecksum(file io.Reader) (string, error) {
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
