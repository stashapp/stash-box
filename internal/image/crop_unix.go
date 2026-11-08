//go:build unix

package image

import (
	"github.com/davidbyttow/govips/v2/vips"

	"github.com/stashapp/stash-box/internal/models"
)

// crop applies EXIF orientation, then the rotation that grows the canvas, then the frame against that canvas
func crop(data []byte, c models.ImageCropInput) ([]byte, error) {
	defer vips.ShutdownThread()

	image, err := vips.NewImageFromBuffer(data)
	if err != nil {
		return nil, ErrCropUnsupportedFormat
	}
	defer image.Close()

	format := image.Format()

	if err := image.AutoRotate(); err != nil {
		return nil, err
	}

	if c.Angle != 0 {
		// White rather than transparent: a JPEG has no alpha to put the exposed corners in
		white := &vips.ColorRGBA{R: 255, G: 255, B: 255, A: 255}
		if err := image.Similarity(1, c.Angle, white, 0, 0, 0, 0); err != nil {
			return nil, err
		}
	}

	left, top, width, height := cropPixels(c, image.Width(), image.Height())
	if err := image.ExtractArea(left, top, width, height); err != nil {
		return nil, err
	}

	return exportCropped(image, format)
}

// exportCropped re-encodes in the format that came in, since this copy is stored and served
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
