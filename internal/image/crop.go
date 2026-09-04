package image

import (
	"errors"
	"fmt"
	"math"
)

// CropRect is a frame to cut an image down to, as fractions of the image the
// client is looking at
//
// Fractions rather than pixels because the client is dragging a frame over a
// scaled preview and does not know, or need to know, the source resolution
type CropRect struct {
	X      float64
	Y      float64
	Width  float64
	Height float64

	// Angle is degrees clockwise, applied before the frame is cut. X, Y, Width
	// and Height are measured against the *rotated* image, which is larger
	// than the original - it is what the client is dragging over
	Angle float64
}

// ErrCropUnsupportedFormat reports an upload that cannot be cropped. SVG is the
// case that matters: it has no pixels to cut and no dimensions worth speaking
// of, which is why it is stored with -1 for both
var ErrCropUnsupportedFormat = errors.New("this image format cannot be cropped")

const maxCropAngle = 90

// Validate rejects a frame that cannot describe part of an image
func (c CropRect) Validate() error {
	for name, v := range map[string]float64{
		"x": c.X, "y": c.Y, "width": c.Width, "height": c.Height, "angle": c.Angle,
	} {
		if math.IsNaN(v) || math.IsInf(v, 0) {
			return fmt.Errorf("crop %s is not a number", name)
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

// IsIdentity reports a frame that would keep the whole image unchanged.
//
// Worth spotting: cropping means re-encoding, and re-encoding an image nobody
// actually cropped costs a generation of quality for nothing
func (c CropRect) IsIdentity() bool {
	return c.Angle == 0 && c.X == 0 && c.Y == 0 && c.Width == 1 && c.Height == 1
}

// pixels turns the frame into whole pixels within a width x height image
//
// Rounding outward would let a frame at the very edge ask for a pixel that is
// not there, so the result is clamped to the image and to at least one pixel in
// each direction. A crop of nothing is caught by Validate; this is the
// arithmetic being careful, not policy
func (c CropRect) pixels(width, height int) (left, top, w, h int) {
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

// croppedQuality is what a cropped upload is re-encoded at, for every lossy
// format. Higher than the thumbnail quality in config, since this is the copy
// everything else is derived from
//
// Lossless is not the cautious choice it looks like: a photograph stored that
// way runs several times the size it arrived at
const croppedQuality = 95
