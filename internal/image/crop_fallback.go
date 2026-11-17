package image

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"math"

	xdraw "golang.org/x/image/draw"
	"golang.org/x/image/math/f64"

	"github.com/stashapp/stash-box/internal/models"
)

var white = color.NRGBA{R: 255, G: 255, B: 255, A: 255}

// cropFallback is the pure-Go crop for builds without libvips; Go's decoders ignore EXIF orientation
func cropFallback(data []byte, c models.ImageCropInput) ([]byte, error) {
	src, format, err := image.Decode(bytes.NewReader(data))
	if err != nil || (format != "jpeg" && format != "png") {
		return nil, ErrCropUnsupportedFormat
	}

	if c.Angle != 0 {
		src = rotate(src, c.Angle)
	}

	bounds := src.Bounds()
	left, top, width, height := cropPixels(c, bounds.Dx(), bounds.Dy())

	frame := image.Rect(0, 0, width, height)
	out := image.NewNRGBA(frame)
	draw.Draw(out, frame, src, bounds.Min.Add(image.Pt(left, top)), draw.Src)

	buf := new(bytes.Buffer)
	if format == "png" {
		err = png.Encode(buf, out)
	} else {
		err = jpeg.Encode(buf, out, &jpeg.Options{Quality: croppedQuality})
	}
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// rotate turns an image clockwise about its centre onto a white canvas grown to fit, as libvips does
func rotate(src image.Image, degrees float64) image.Image {
	bounds := src.Bounds()
	w, h := float64(bounds.Dx()), float64(bounds.Dy())
	sin, cos := math.Sincos(degrees * math.Pi / 180)
	outW := math.Round(w*math.Abs(cos) + h*math.Abs(sin))
	outH := math.Round(w*math.Abs(sin) + h*math.Abs(cos))

	out := image.NewNRGBA(image.Rect(0, 0, int(outW), int(outH)))
	draw.Draw(out, out.Bounds(), image.NewUniform(white), image.Point{}, draw.Src)

	srcCx, srcCy := float64(bounds.Min.X)+w/2, float64(bounds.Min.Y)+h/2
	xdraw.BiLinear.Transform(out, f64.Aff3{
		cos, -sin, outW/2 - cos*srcCx + sin*srcCy,
		sin, cos, outH/2 - sin*srcCx - cos*srcCy,
	}, src, bounds, xdraw.Over, nil)
	return out
}
