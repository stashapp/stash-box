//go:build unix

package image

import (
	"github.com/davidbyttow/govips/v2/vips"
)

// Crop cuts an upload down to a frame, rotating it first if asked
//
// One decode and one encode, which is the whole reason this is not done in the
// browser: a canvas crop would be a second lossy generation on top of whatever
// the contributor started with
//
// Order matters and is not interchangeable:
//
//  1. EXIF orientation, so the coordinates the client sent (which are the
//     ones shown in the browser) mean the same thing here. Without this every
//     photograph taken on a phone crops sideways
//  2. The rotation, which grows the canvas to fit the turned image
//  3. The frame, measured against that grown canvas
func Crop(data []byte, rect CropRect) ([]byte, error) {
	defer vips.ShutdownThread()

	if err := rect.Validate(); err != nil {
		return nil, err
	}

	image, err := vips.NewImageFromBuffer(data)
	if err != nil {
		return nil, ErrCropUnsupportedFormat
	}
	defer image.Close()

	format := image.Format()

	if err := image.AutoRotate(); err != nil {
		return nil, err
	}

	if rect.Angle != 0 {
		// White rather than transparent: the corners a rotation exposes are
		// going to be cropped away in the ordinary case, and a JPEG has no
		// alpha to put them in anyway
		white := &vips.ColorRGBA{R: 255, G: 255, B: 255, A: 255}
		if err := image.Similarity(1, rect.Angle, white, 0, 0, 0, 0); err != nil {
			return nil, err
		}
	}

	left, top, width, height := rect.pixels(image.Width(), image.Height())
	if err := image.ExtractArea(left, top, width, height); err != nil {
		return nil, err
	}

	return exportCropped(image, format)
}

// exportCropped re-encodes in the format that came in
//
// Changing format here would be a surprise: this is the image that gets stored
// and served, not a derived thumbnail, and the resizing path is free to make
// its own choices because nothing keeps what it produces
func exportCropped(image *vips.ImageRef, format vips.ImageType) ([]byte, error) {
	switch format {
	case vips.ImageTypePNG:
		params := vips.NewPngExportParams()
		params.StripMetadata = true
		out, _, err := image.ExportPng(params)
		return out, err

	case vips.ImageTypeWEBP:
		params := vips.NewWebpExportParams()
		params.StripMetadata = true
		params.Quality = croppedQuality
		out, _, err := image.ExportWebp(params)
		return out, err

	case vips.ImageTypeJPEG:
		params := vips.NewJpegExportParams()
		params.StripMetadata = true
		params.Quality = croppedQuality
		params.Interlace = true
		params.OptimizeCoding = true
		params.SubsampleMode = vips.VipsForeignSubsampleAuto
		out, _, err := image.ExportJpeg(params)
		return out, err

	default:
		return nil, ErrCropUnsupportedFormat
	}
}
