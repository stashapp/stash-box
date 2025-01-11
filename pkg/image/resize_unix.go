//go:build unix

package image

import (
	"io"
	"math"

	"github.com/davidbyttow/govips/v2/vips"
)

func Resize(reader io.Reader, maxSize int) ([]byte, error) {
	defer vips.ShutdownThread()

	image, err := vips.NewImageFromReader(reader)
	if err != nil {
		return nil, err
	}

	h := image.Height()
	w := image.Width()
	scale := float64(maxSize) / math.Max(float64(h), float64(w))
	if scale < 1 {
		if err := image.Resize(scale, vips.KernelCubic); err != nil {
			return nil, err
		}
	}

	ep := vips.NewJpegExportParams()
	ep.StripMetadata = true
	ep.Quality = 80
	ep.Interlace = true
	ep.OptimizeCoding = true
	ep.SubsampleMode = vips.VipsForeignSubsampleAuto

	imageBytes, _, err := image.ExportJpeg(ep)
	return imageBytes, err
}

func InitResizer() {
	vips.LoggingSettings(nil, vips.LogLevelWarning)
	vips.Startup(nil)
}
