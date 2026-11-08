//go:build integration

package api_test

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	dbtest "github.com/stashapp/stash-box/internal/database/testutil"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/storage"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var cropImageSuffix int

// gradient paints R from the column and G from the row, so a stored pixel names the source pixel it
// came from, and a counter into B so no two calls dedupe into one image
func gradient(width, height int) *image.RGBA {
	cropImageSuffix++
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := range height {
		for x := range width {
			img.Set(x, y, color.RGBA{R: uint8(x), G: uint8(y), B: uint8(cropImageSuffix), A: 255})
		}
	}
	// The counter's high byte, as createTestImage does, since B alone wraps at 256
	img.Set(0, 0, color.RGBA{G: uint8(cropImageSuffix >> 8), B: uint8(cropImageSuffix), A: 255})
	return img
}

func gradientPNG(t *testing.T, width, height int) []byte {
	t.Helper()
	var buf bytes.Buffer
	require.NoError(t, png.Encode(&buf, gradient(width, height)))
	return buf.Bytes()
}

func (s *testRunner) uploadCrop(data []byte, crop *models.ImageCropInput) (*models.Image, error) {
	return s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{File: bytes.NewReader(data), Size: int64(len(data)), Filename: "crop.png"},
		Crop: crop,
	})
}

func (s *testRunner) uploadCropped(width, height int, crop *models.ImageCropInput) (*models.Image, error) {
	s.t.Helper()
	return s.uploadCrop(gradientPNG(s.t, width, height), crop)
}

// storedPixel samples the stored file, whose PNG pixels are the source's exactly
func (s *testRunner) storedPixel(img *models.Image, fx, fy float64) color.RGBA {
	s.t.Helper()

	reader, _, err := storage.Image().ReadFile(*img)
	require.NoError(s.t, err)
	defer reader.Close()

	decoded, format, err := image.Decode(reader)
	require.NoError(s.t, err)
	require.Equal(s.t, "png", format)

	bounds := decoded.Bounds()
	x := bounds.Min.X + int(float64(bounds.Dx())*fx)
	y := bounds.Min.Y + int(float64(bounds.Dy())*fy)

	r, g, b, a := decoded.At(x, y).RGBA()
	return color.RGBA{R: uint8(r >> 8), G: uint8(g >> 8), B: uint8(b >> 8), A: uint8(a >> 8)}
}

func TestImageCreateCropsToTheRequestedFrame(t *testing.T) {
	s := asAdmin(t)

	for _, tc := range []struct {
		name          string
		crop          models.ImageCropInput
		width, height int
	}{
		{"the top-left quarter", models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}, 200, 300},
		{"the bottom-right quarter", models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}, 200, 300},
		{"a 2:3 frame out of a square", models.ImageCropInput{X: 0.25, Y: 0, Width: 0.5, Height: 0.75}, 400, 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			img, err := s.uploadCropped(tc.width, tc.height, &tc.crop)
			require.NoError(t, err)

			assert.Equal(t, int(tc.crop.Width*float64(tc.width)), img.Width)
			assert.Equal(t, int(tc.crop.Height*float64(tc.height)), img.Height)

			// Which region, not just how big: the middle pixel names the source column and row
			middle := s.storedPixel(img, 0.5, 0.5)
			assert.Equal(t, uint8(int(tc.crop.X*float64(tc.width))+img.Width/2), middle.R)
			assert.Equal(t, uint8(int(tc.crop.Y*float64(tc.height))+img.Height/2), middle.G)
		})
	}
}

// Checked by deduplication: a re-encode keeps the dimensions but not the checksum
func TestImageCreateLeavesAFullFrameAlone(t *testing.T) {
	s := asAdmin(t)
	data := gradientPNG(t, 120, 180)

	plain, err := s.uploadCrop(data, nil)
	require.NoError(t, err)
	whole, err := s.uploadCrop(data, &models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1})
	require.NoError(t, err)

	assert.Equal(t, plain.ID, whole.ID)
	assert.Equal(t, 120, whole.Width)
	assert.Equal(t, 180, whole.Height)
}

func TestIdenticalCropsDeduplicate(t *testing.T) {
	s := asAdmin(t)
	data := gradientPNG(t, 300, 400)
	frame := models.ImageCropInput{X: 0.1, Y: 0.2, Width: 0.5, Height: 0.5}

	first, err := s.uploadCrop(data, &frame)
	require.NoError(t, err)
	second, err := s.uploadCrop(data, &frame)
	require.NoError(t, err)
	other, err := s.uploadCrop(data, &models.ImageCropInput{X: 0.4, Y: 0.2, Width: 0.5, Height: 0.5})
	require.NoError(t, err)

	assert.Equal(t, first.ID, second.ID)
	assert.NotEqual(t, first.ID, other.ID)
}

// Rotation grows the canvas to fit the turned image rather than clipping its corners
func TestImageCreateRotatesBeforeCropping(t *testing.T) {
	s := asAdmin(t)

	for _, tc := range []struct {
		name          string
		angle         float64
		width, height int
	}{
		{"a quarter turn swaps the sides", 90, 300, 200},
		{"a tilt grows the canvas", 10, 249, 330},
	} {
		t.Run(tc.name, func(t *testing.T) {
			img, err := s.uploadCropped(200, 300, &models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: tc.angle})
			require.NoError(t, err)
			assert.Equal(t, tc.width, img.Width)
			assert.Equal(t, tc.height, img.Height)
		})
	}
}

func TestImageCreateRejectsAnUnusableFrame(t *testing.T) {
	s := asAdmin(t)

	_, err := s.uploadCropped(200, 300, &models.ImageCropInput{X: 0.8, Y: 0, Width: 0.5, Height: 1})
	assert.Error(t, err)
}

func TestImageCreateRejectsACropWithoutAFile(t *testing.T) {
	s := asAdmin(t)

	url := "https://example.com/image.jpg"
	_, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		URL:  &url,
		Crop: &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5},
	})
	assert.Error(t, err)
}

func TestRejectedLabelsLeaveNoRetainedOriginalBehind(t *testing.T) {
	s := asAdmin(t)
	images := dbtest.Factory().Image()

	before, err := images.FindUnused(s.ctx)
	require.NoError(t, err)

	data := gradientPNG(t, 200, 300)
	badDate := "not a date"
	_, err = s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{File: bytes.NewReader(data), Size: int64(len(data)), Filename: "rejected.png"},
		Crop: &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5},
		Date: &badDate,
	})
	require.Error(t, err)

	after, err := images.FindUnused(s.ctx)
	require.NoError(t, err)
	assert.Len(t, after, len(before))
}

// exifOrientedJPEG adds an APP1 segment with one Orientation IFD entry, assembled by hand
func exifOrientedJPEG(t *testing.T, img image.Image, orientation uint16) []byte {
	t.Helper()

	var encoded bytes.Buffer
	require.NoError(t, jpeg.Encode(&encoded, img, &jpeg.Options{Quality: 90}))
	raw := encoded.Bytes()

	tiff := []byte{
		'I', 'I', 0x2a, 0x00, // little-endian, and 42
		0x08, 0x00, 0x00, 0x00, // IFD0 starts 8 bytes in
		0x01, 0x00, // one entry
		0x12, 0x01, // tag 0x0112, Orientation
		0x03, 0x00, // type 3, SHORT
		0x01, 0x00, 0x00, 0x00, // one value
		byte(orientation), byte(orientation >> 8), 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, // no next IFD
	}

	payload := append([]byte("Exif\x00\x00"), tiff...)
	length := len(payload) + 2 // covers itself but not the marker

	out := make([]byte, 0, len(raw)+length+2)
	out = append(out, raw[:2]...) // SOI
	out = append(out, 0xff, 0xe1, byte(length>>8), byte(length))
	out = append(out, payload...)
	out = append(out, raw[2:]...)
	return out
}

// Orientation 6 displays a tall 200x300 as a wide 300x200, whose left half is 150x200
func TestImageCreateHonoursEXIFOrientation(t *testing.T) {
	s := asAdmin(t)

	img, err := s.uploadCrop(exifOrientedJPEG(t, gradient(200, 300), 6),
		&models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1})
	require.NoError(t, err)

	assert.Equal(t, 150, img.Width)
	assert.Equal(t, 200, img.Height)
}
