package image

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// gradientPNG is a synthetic source whose pixel values encode their own
// coordinates, so a crop's *region* is provable from the output, not just
// its dimensions.
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

	out, err := cropFallback(source, CropRect{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5})
	require.NoError(t, err)

	img := decodePNG(t, out)
	assert.Equal(t, 100, img.Bounds().Dx())
	assert.Equal(t, 50, img.Bounds().Dy())

	// The output's top-left is the source's centre: the gradient encodes
	// coordinates, so the colour proves the region.
	r, g, _, _ := img.At(0, 0).RGBA()
	assert.InDelta(t, 127, int(r>>8), 3, "left edge should come from the source's horizontal midpoint")
	assert.InDelta(t, 127, int(g>>8), 3, "top edge should come from the source's vertical midpoint")
}

// The fallback must agree with libvips about geometry: same input, same
// frame, same output size. Pixels may differ (nearest-neighbour vs vips
// resampling, different encoders); the shape may not. Runs on the same
// linux CI as the vips path itself, which is the point of keeping
// cropFallback outside the build tag.
func TestCropFallbackMatchesVipsGeometry(t *testing.T) {
	source := gradientPNG(t, 300, 200)

	cases := []CropRect{
		{X: 0.25, Y: 0.25, Width: 0.5, Height: 0.5},
		{X: 0, Y: 0, Width: 1, Height: 0.4},
		{X: 0.1, Y: 0.2, Width: 0.6, Height: 0.5, Angle: 7},
		{X: 0.3, Y: 0.1, Width: 0.4, Height: 0.7, Angle: -30},
	}
	for _, rect := range cases {
		fromVips, err := Crop(source, rect)
		require.NoError(t, err)
		fromFallback, err := cropFallback(source, rect)
		require.NoError(t, err)

		vipsImg := decodePNG(t, fromVips)
		fallbackImg := decodePNG(t, fromFallback)
		assert.Equal(t, vipsImg.Bounds().Dx(), fallbackImg.Bounds().Dx(), "width for %+v", rect)
		assert.Equal(t, vipsImg.Bounds().Dy(), fallbackImg.Bounds().Dy(), "height for %+v", rect)
	}
}
