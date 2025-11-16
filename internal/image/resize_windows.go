//go:build windows || darwin

package image

import (
	"bytes"
	"image"
	"image/jpeg"
	"image/png"
	"io"

	"github.com/disintegration/imaging"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
)

func Resize(reader io.Reader, max int, dbimage *models.Image, fileSize int64) ([]byte, error) {
	return resizeImage(reader, int64(max))
}

func InitResizer() {}

func resizeImage(srcReader io.Reader, maxDimension int64) ([]byte, error) {
	var resizedImage image.Image
	srcImage, format, err := image.Decode(srcReader)
	if err != nil {
		return nil, err
	}

	// if height is longer then resize by height instead of width
	if dim := srcImage.Bounds().Max; dim.Y > dim.X {
		resizedImage = imaging.Resize(srcImage, 0, int(maxDimension), imaging.MitchellNetravali)
	} else {
		resizedImage = imaging.Resize(srcImage, int(maxDimension), 0, imaging.MitchellNetravali)
	}

	buf := new(bytes.Buffer)

	if format == "png" {
		err = png.Encode(buf, resizedImage)
		if err != nil {
			return nil, err
		}
	} else {
		options := jpeg.Options{
			Quality: config.GetImageJpegQuality(),
		}
		err = jpeg.Encode(buf, resizedImage, &options)
		if err != nil {
			return nil, err
		}
	}
	return buf.Bytes(), nil
}
