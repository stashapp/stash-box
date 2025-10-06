//go:build unix

package image

import (
	"io"

	"github.com/davidbyttow/govips/v2/vips"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
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

	format := image.Format()

	if format == vips.ImageTypePNG {
		ep := vips.NewWebpExportParams()
		ep.StripMetadata = true
		ep.Lossless = true

		imageBytes, _, err := image.ExportWebp(ep)
		return imageBytes, err
	}

	ep := vips.NewJpegExportParams()
	ep.StripMetadata = true
	ep.Quality = config.GetImageJpegQuality()
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
