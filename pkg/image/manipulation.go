package image

import (
	"bytes"
	"image"
	"image/jpeg"
	"image/png"
	"io"

	_ "image/gif"

	_ "golang.org/x/image/webp"

	"github.com/disintegration/imaging"
	"github.com/kolesa-team/go-webp/encoder"
	"github.com/kolesa-team/go-webp/webp"
	"github.com/stashapp/stash-box/pkg/manager/config"
)

func manipulateImage(srcReader io.ReadSeeker) (*bytes.Reader, error) {
	imageConfig := config.GetImageConfig()

	srcImage, srcFormat, err := image.Decode(srcReader)
	if err != nil {
		return nil, err
	}

	switch {
	case imageRequiresResizing(srcImage, imageConfig.MaxWidth, imageConfig.MaxHeight):
		{
			resizedImage := resizeImage(srcImage, imageConfig.MaxWidth, imageConfig.MaxHeight, imageConfig.Filter)
			return encodeImage(resizedImage, imageConfig.Format)
		}
	case needsEncoding(srcFormat, imageConfig.Format):
		{
			// image doesn't require resizing but still needs to be encoded into the right format
			return encodeImage(srcImage, imageConfig.Format)
		}
	default:
		{
			// image doesn't need to be manipulated
			return nil, nil
		}
	}
}

func needsEncoding(srcFormat string, newFormatType config.ImageFormatType) bool {
	switch newFormatType {
	case config.PNG:
		return srcFormat != "png"
	case config.JPEG:
		return srcFormat != "jpeg"
	case config.WEBP:
		return srcFormat != "webp"
	// case config.AVIF:
	// 	return srcFormat != "avif"
	default:
		return true
	}
}

func encodeImage(inputImage image.Image, newFormatType config.ImageFormatType) (*bytes.Reader, error) {
	buf := new(bytes.Buffer)

	switch newFormatType {
	case config.PNG:
		{
			if err := png.Encode(buf, inputImage); err != nil {
				return nil, err
			}
		}
	case config.JPEG:
		{
			options := jpeg.Options{
				Quality: 85,
			}

			if err := jpeg.Encode(buf, inputImage, &options); err != nil {
				return nil, err
			}
		}
	case config.WEBP:
		{
			options, err := encoder.NewLossyEncoderOptions(encoder.PresetDefault, 75)
			if err != nil {
				return nil, err
			}

			if err := webp.Encode(buf, inputImage, options); err != nil {
				return nil, err
			}
		}
	}

	return bytes.NewReader(buf.Bytes()), nil
}

func imageRequiresResizing(srcImage image.Image, maxWidth int64, maxHeight int64) bool {
	// resizing is disabled
	if maxWidth == 0 && maxHeight == 0 {
		return false
	}

	dim := srcImage.Bounds().Max

	if dim.X > dim.Y {
		// image is horizontal

		// resizing is disabled for horizontal images
		if maxWidth == 0 {
			return false
		}

		return dim.X > int(maxWidth)
	}

	// image is vertical

	// resizing is disabled for vertical images
	if maxHeight == 0 {
		return false
	}

	return dim.Y > int(maxHeight)
}

func getResamplingFilterFromConfig(filterType config.ImageFilterType) imaging.ResampleFilter {
	switch filterType {
	case config.LanczosFilter:
		return imaging.Lanczos
	case config.MitchellNetravaliFilter:
		return imaging.MitchellNetravali
	case config.LinearFilter:
		return imaging.Linear
	case config.BoxFilter:
		return imaging.Box
	case config.NearestNeighborFilter:
		return imaging.NearestNeighbor
	default:
		return imaging.MitchellNetravali
	}
}

func resizeImage(srcImage image.Image, maxWidth int64, maxHeight int64, filterType config.ImageFilterType) image.Image {
	var resizedImage image.Image

	// if height is longer then resize by height instead of width
	if dim := srcImage.Bounds().Max; dim.Y > dim.X {
		resizedImage = imaging.Resize(srcImage, 0, int(maxWidth), getResamplingFilterFromConfig(filterType))
	} else {
		resizedImage = imaging.Resize(srcImage, int(maxHeight), 0, getResamplingFilterFromConfig(filterType))
	}

	return resizedImage
}
