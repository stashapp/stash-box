package image

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

// gradientPNG encodes each pixel's coordinates in its colour, so a crop's region is provable
func gradientPNG(t *testing.T, width, height int) []byte {
	t.Helper()

	img := image.NewNRGBA(image.Rect(0, 0, width, height))
	for y := range height {
		for x := range width {
			img.Set(x, y, color.NRGBA{
				R: uint8(x * 255 / width),
				G: uint8(y * 255 / height),
				B: 0,
				A: 255,
			})
		}
	}
	var buf bytes.Buffer
	require.NoError(t, png.Encode(&buf, img))
	return buf.Bytes()
}

func decodePNG(t *testing.T, data []byte) image.Image {
	t.Helper()
	img, err := png.Decode(bytes.NewReader(data))
	require.NoError(t, err)
	return img
}

func TestCropFallbackCutsTheRequestedRegion(t *testing.T) {
	source := gradientPNG(t, 200, 100)

	out, err := cropFallback(source, models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5})
	require.NoError(t, err)

	img := decodePNG(t, out)
	assert.Equal(t, 100, img.Bounds().Dx())
	assert.Equal(t, 50, img.Bounds().Dy())

	r, g, _, _ := img.At(0, 0).RGBA()
	assert.InDelta(t, 127, int(r>>8), 3, "left edge should come from the source's horizontal midpoint")
	assert.InDelta(t, 127, int(g>>8), 3, "top edge should come from the source's vertical midpoint")
}
