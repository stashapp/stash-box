//go:build windows || darwin

package image

import (
	"bytes"
	"errors"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"math"

	"golang.org/x/image/draw"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
)

var errImageZeroSize = errors.New("image has 0px dimension")

// mitchellNetravali is the B-C spline with B = C = 1/3.
var mitchellNetravali = &draw.Kernel{
	Support: 2,
	At: func(x float64) float64 {
		const b, c = 1.0 / 3.0, 1.0 / 3.0
		x = math.Abs(x)
		switch {
		case x < 1:
			return ((12-9*b-6*c)*x*x*x + (-18+12*b+6*c)*x*x + (6 - 2*b)) / 6
		case x < 2:
			return ((-b-6*c)*x*x*x + (6*b+30*c)*x*x + (-12*b-48*c)*x + (8*b + 24*c)) / 6
		default:
			return 0
		}
	},
}

func Resize(reader io.Reader, max int, dbimage *models.Image, fileSize int64) ([]byte, error) {
	return resizeImage(reader, int64(max))
}

func InitResizer() error { return nil }

func resizeImage(srcReader io.Reader, maxDimension int64) ([]byte, error) {
	srcImage, format, err := image.Decode(srcReader)
	if err != nil {
		return nil, err
	}

	srcBounds := srcImage.Bounds()
	srcW, srcH := srcBounds.Dx(), srcBounds.Dy()
	if srcW <= 0 || srcH <= 0 {
		return nil, errImageZeroSize
	}

	// scale the longer side down to maxDimension, preserving aspect ratio
	dstW, dstH := int(maxDimension), int(maxDimension)
	if srcH > srcW {
		dstW = scaleDimension(dstH, srcW, srcH)
	} else {
		dstH = scaleDimension(dstW, srcH, srcW)
	}

	resizedImage := image.NewNRGBA(image.Rect(0, 0, dstW, dstH))
	mitchellNetravali.Scale(resizedImage, resizedImage.Bounds(), srcImage, srcBounds, draw.Src, nil)

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

// scaleDimension scales known by the num/denom ratio, rounding to at least 1px.
func scaleDimension(known, num, denom int) int {
	scaled := float64(known) * float64(num) / float64(denom)
	return int(math.Max(1, math.Floor(scaled+0.5)))
}
