//go:build unix

package image

import (
	"image"
	"math/rand"
	"testing"

	"github.com/davidbyttow/govips/v2/vips"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/stashapp/stash-box/internal/models"
)

// photoLike has the gradients and noise of a photograph, which a flat pattern would compress the same at any
// setting
func photoLike(t *testing.T, width, height int, export func(*vips.ImageRef) ([]byte, error)) []byte {
	t.Helper()
	if err := vips.Startup(nil); err != nil {
		t.Fatal(err)
	}

	img := image.NewRGBA(image.Rect(0, 0, width, height))
	rng := rand.New(rand.NewSource(1))
	for y := range height {
		for x := range width {
			i := (y*width + x) * 4
			img.Pix[i] = byte((x*255/width + rng.Intn(24)) % 256)
			img.Pix[i+1] = byte((y*255/height + rng.Intn(24)) % 256)
			img.Pix[i+2] = byte(((x+y)*255/(width+height) + rng.Intn(24)) % 256)
			img.Pix[i+3] = 255
		}
	}

	ref, err := vips.NewImageFromGoImage(img)
	if err != nil {
		t.Fatal(err)
	}

	out, err := export(ref)
	if err != nil {
		t.Fatal(err)
	}
	return out
}

// The size limit is checked on the bytes sent, so a format that multiplies them matters
func TestCropDoesNotInflateWebp(t *testing.T) {
	source := photoLike(t, 2000, 3000, func(ref *vips.ImageRef) ([]byte, error) {
		out, _, err := ref.ExportWebp(vips.NewWebpExportParams())
		return out, err
	})

	cropped, err := Crop(source, models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: 1})
	if err != nil {
		t.Fatal(err)
	}

	ratio := float64(len(cropped)) / float64(len(source))
	if ratio > 3 {
		t.Errorf("cropping grew a %d byte webp to %d (%.2fx); is it being re-encoded losslessly?",
			len(source), len(cropped), ratio)
	}
}

// The stored master keeps the format it arrived in
func TestCropKeepsTheFormatItWasGiven(t *testing.T) {
	source := photoLike(t, 400, 600, func(ref *vips.ImageRef) ([]byte, error) {
		out, _, err := ref.ExportWebp(vips.NewWebpExportParams())
		return out, err
	})

	cropped, err := Crop(source, models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5})
	if err != nil {
		t.Fatal(err)
	}

	ref, err := vips.NewImageFromBuffer(cropped)
	if err != nil {
		t.Fatal(err)
	}
	defer ref.Close()

	if got := ref.Format(); got != vips.ImageTypeWEBP {
		t.Errorf("cropped a webp and got %v back", got)
	}
}

// The fallback must agree with libvips about geometry; pixels may differ
func TestCropFallbackMatchesVipsGeometry(t *testing.T) {
	source := gradientPNG(t, 300, 200)

	cases := []models.ImageCropInput{
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
