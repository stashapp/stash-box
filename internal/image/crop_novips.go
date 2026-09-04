//go:build windows

package image

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"math"
)

// white fills the corners a rotation exposes
var white = color.NRGBA{R: 255, G: 255, B: 255, A: 255}

// Crop cuts an upload down to a frame, rotating it first if asked
//
// The pure-Go counterpart to the libvips path, for builds without it. Same
// order of operations, with one difference that cannot be helped: Go's image
// decoders do not apply EXIF orientation, so an upload whose orientation lives
// only in metadata crops from the unrotated pixels. The libvips build is what
// production uses (and what macOS gets, via the unix tag); this keeps a
// developer on Windows able to run the thing
func Crop(data []byte, rect CropRect) ([]byte, error) {
	if err := rect.Validate(); err != nil {
		return nil, err
	}

	src, format, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, ErrCropUnsupportedFormat
	}
	if format != "jpeg" && format != "png" {
		return nil, ErrCropUnsupportedFormat
	}

	if rect.Angle != 0 {
		src = rotate(src, rect.Angle)
	}

	bounds := src.Bounds()
	left, top, width, height := rect.pixels(bounds.Dx(), bounds.Dy())

	frame := image.Rect(0, 0, width, height)
	out := image.NewNRGBA(frame)
	draw.Draw(out, frame, src, bounds.Min.Add(image.Pt(left, top)), draw.Src)

	buf := new(bytes.Buffer)
	if format == "png" {
		if err := png.Encode(buf, out); err != nil {
			return nil, err
		}
		return buf.Bytes(), nil
	}
	if err := jpeg.Encode(buf, out, &jpeg.Options{Quality: croppedQuality}); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// rotate turns an image clockwise about its centre, growing the canvas to fit,
// so the result matches what libvips produces for the same angle
//
// Nearest-neighbour: this path exists so the application runs, not so it
// produces the best possible pixels, and the alternative is hand-rolling a
// resampling filter that libvips already has
func rotate(src image.Image, degrees float64) image.Image {
	bounds := src.Bounds()
	w, h := float64(bounds.Dx()), float64(bounds.Dy())

	radians := degrees * math.Pi / 180
	sin, cos := math.Abs(math.Sin(radians)), math.Abs(math.Cos(radians))
	outW := int(math.Round(w*cos + h*sin))
	outH := int(math.Round(w*sin + h*cos))

	out := image.NewNRGBA(image.Rect(0, 0, outW, outH))
	draw.Draw(out, out.Bounds(), image.NewUniform(white), image.Point{}, draw.Src)

	// Walk the destination and pull from the source, which leaves no gaps the
	// way walking the source and pushing would
	srcCx, srcCy := w/2, h/2
	dstCx, dstCy := float64(outW)/2, float64(outH)/2
	rotSin, rotCos := math.Sin(radians), math.Cos(radians)

	for y := range outH {
		for x := range outW {
			dx, dy := float64(x)-dstCx, float64(y)-dstCy
			sx := int(math.Round(dx*rotCos + dy*rotSin + srcCx))
			sy := int(math.Round(-dx*rotSin + dy*rotCos + srcCy))
			if sx < 0 || sy < 0 || sx >= bounds.Dx() || sy >= bounds.Dy() {
				continue
			}
			out.Set(x, y, src.At(bounds.Min.X+sx, bounds.Min.Y+sy))
		}
	}

	return out
}
