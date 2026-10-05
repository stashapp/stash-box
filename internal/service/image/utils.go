package image

import (
	"bytes"
	"crypto/md5"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	"io"

	_ "golang.org/x/image/webp"

	issvg "github.com/h2non/go-is-svg"

	"github.com/stashapp/stash-box/internal/models"
)

var ErrImageZeroSize = errors.New("image has 0px dimension")

func populateImageDimensions(imgReader *bytes.Reader, dest *models.Image) error {
	img, format, err := image.Decode(imgReader)
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

	if format != "jpeg" && format != "webp" && format != "png" {
		return fmt.Errorf("unsupported image format: %s", format)
	}

	dest.Width = img.Bounds().Max.X
	dest.Height = img.Bounds().Max.Y

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
