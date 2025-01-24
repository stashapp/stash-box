//go:build unix

package image

import (
	"io"

	"github.com/davidbyttow/govips/v2/vips"
	"github.com/stashapp/stash-box/pkg/models"
)

func Resize(reader io.Reader, maxSize int, dbimage *models.Image, fileSize int64) ([]byte, error) {
	defer vips.ShutdownThread()

	buffer := make([]byte, fileSize)
	if _, err := io.ReadFull(reader, buffer); err != nil {
		return nil, err
	}

	image, err := vips.NewThumbnailFromBuffer(buffer, maxSize, maxSize, vips.InterestingNone)
	if err != nil {
		return nil, err
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
	vips.Startup(&vips.Config{MaxCacheSize: 0, MaxCacheMem: 0})
}
