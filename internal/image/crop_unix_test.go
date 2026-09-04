//go:build unix

package image

import (
	"image"
	"math/rand"
	"testing"

	"github.com/davidbyttow/govips/v2/vips"
)

// photoLike builds a source with the properties that separate a photograph
// from a diagram: smooth gradients, and noise on top of them. A flat test
// pattern compresses the same way whatever the encoder is told to do, so it
// would not notice the setting this file exists to check
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

// The size limit is checked on the way in, on the bytes the client sent, so an
// encoding that multiplies them lands an in-policy upload well over the cap.
// Storing a photograph as lossless WebP does exactly that
func TestCropDoesNotInflateWebp(t *testing.T) {
	source := photoLike(t, 2000, 3000, func(ref *vips.ImageRef) ([]byte, error) {
		out, _, err := ref.ExportWebp(vips.NewWebpExportParams())
		return out, err
	})

	cropped, err := Crop(source, CropRect{X: 0, Y: 0, Width: 1, Height: 1, Angle: 1})
	if err != nil {
		t.Fatal(err)
	}

	ratio := float64(len(cropped)) / float64(len(source))
	if ratio > 3 {
		t.Errorf("cropping grew a %d byte webp to %d (%.2fx); is it being re-encoded losslessly?",
			len(source), len(cropped), ratio)
	}
}

// The stored master keeps the format it arrived in, so nothing downstream has
// to guess: a webp upload stays a webp
func TestCropKeepsTheFormatItWasGiven(t *testing.T) {
	source := photoLike(t, 400, 600, func(ref *vips.ImageRef) ([]byte, error) {
		out, _, err := ref.ExportWebp(vips.NewWebpExportParams())
		return out, err
	})

	cropped, err := Crop(source, CropRect{X: 0, Y: 0, Width: 0.5, Height: 0.5})
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
