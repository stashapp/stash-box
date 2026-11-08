package image

import (
	"errors"
	"fmt"
	"math"

	"github.com/stashapp/stash-box/internal/models"
)

// ErrCropUnsupportedFormat reports an upload that cannot be cropped, like SVG
var ErrCropUnsupportedFormat = errors.New("this image format cannot be cropped")

const maxCropAngle = 90

// croppedQuality is what a cropped upload is re-encoded at; higher than thumbnails since this copy is the master
const croppedQuality = 95

// Crop cuts an image down to a frame given as fractions of the image, rotating it first if asked
func Crop(data []byte, c models.ImageCropInput) ([]byte, error) {
	if err := validateCrop(c); err != nil {
		return nil, err
	}
	if IsIdentity(c) {
		return data, nil
	}
	return crop(data, c)
}

func validateCrop(c models.ImageCropInput) error {
	for _, v := range []float64{c.X, c.Y, c.Width, c.Height, c.Angle} {
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return errors.New("crop contains a value that is not a number")
		}
	}
	if c.Width <= 0 || c.Height <= 0 {
		return fmt.Errorf("crop has no area: %gx%g", c.Width, c.Height)
	}
	if c.X < 0 || c.Y < 0 || c.X+c.Width > 1 || c.Y+c.Height > 1 {
		return fmt.Errorf("crop (%g, %g) %gx%g falls outside the image", c.X, c.Y, c.Width, c.Height)
	}
	if math.Abs(c.Angle) > maxCropAngle {
		return fmt.Errorf("crop angle %g is beyond %d degrees", c.Angle, maxCropAngle)
	}
	return nil
}

// IsIdentity reports a frame that keeps the whole image, which is not worth a re-encode
func IsIdentity(c models.ImageCropInput) bool {
	return c.Angle == 0 && c.X == 0 && c.Y == 0 && c.Width == 1 && c.Height == 1
}

// cropPixels turns the frame into whole pixels, clamped inside a width x height image
func cropPixels(c models.ImageCropInput, width, height int) (left, top, w, h int) {
	left = clamp(int(math.Round(c.X*float64(width))), 0, width-1)
	top = clamp(int(math.Round(c.Y*float64(height))), 0, height-1)
	w = clamp(int(math.Round(c.Width*float64(width))), 1, width-left)
	h = clamp(int(math.Round(c.Height*float64(height))), 1, height-top)
	return left, top, w, h
}

func clamp(v, lo, hi int) int {
	if hi < lo {
		hi = lo
	}
	return min(max(v, lo), hi)
}
