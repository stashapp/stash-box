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

	imagepkg "github.com/stashapp/stash-box/internal/image"
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

// cropUpload cuts an upload down to the frame a client asked for. changed is
// false for an identity frame, when the returned bytes are simply the file
// unchanged: callers use it to decide whether there is any narrower
// framing worth retaining an original behind.
func cropUpload(file []byte, input models.ImageCropInput) (cropped []byte, changed bool, err error) {
	rect := imagepkg.CropRect{
		X:      input.X,
		Y:      input.Y,
		Width:  input.Width,
		Height: input.Height,
	}
	if input.Angle != nil {
		rect.Angle = *input.Angle
	}

	if rect.IsIdentity() {
		return file, false, nil
	}

	cropped, err = imagepkg.Crop(file, rect)
	return cropped, true, err
}
