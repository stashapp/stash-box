//go:build integration

package api_test

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"strconv"
	"testing"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/storage"
	"github.com/stretchr/testify/assert"
)

// Cropping happens on the server, so these go through imageCreate rather than
// testing the geometry in isolation: what matters is that the stored image
// (the one a reviewer will see and the one the checksum is taken from) is the
// frame that was asked for

var cropImageSuffix int

// uploadCropped sends a distinctly-coloured image with a crop attached
//
// Each call needs different pixels, because images are deduplicated on the md5
// of their stored bytes and two identical uploads are one image by design
func (s *testRunner) uploadCropped(width, height int, crop *models.ImageCropInput) (*models.Image, error) {
	s.t.Helper()

	cropImageSuffix++

	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := range height {
		for x := range width {
			// A gradient rather than a flat fill, so a crop of the wrong
			// region is visible as different pixels rather than looking
			// identical to the right one
			img.Set(x, y, color.RGBA{
				R: uint8(x % 256),
				G: uint8(y % 256),
				B: uint8(cropImageSuffix),
				A: 255,
			})
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}

	return s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(buf.Bytes()),
			Size:     int64(buf.Len()),
			Filename: "crop-" + strconv.Itoa(cropImageSuffix) + ".png",
		},
		Crop: crop,
	})
}

// storedPixel reads the image back out of the store and samples it at a
// fraction of the way across and down
//
// The stored file, not the response: dimensions are the one thing a crop of the
// wrong region gets right, so nothing short of looking at the pixels can tell
// the top-left quarter from the bottom-right one. PNG in means PNG out because
// exportCropped re-encodes in the format that came in, so the values are the
// source's exactly, and a tolerance would only be hiding something
func (s *testRunner) storedPixel(img *models.Image, fx, fy float64) color.RGBA {
	s.t.Helper()

	reader, _, err := storage.Image().ReadFile(*img)
	if err != nil {
		s.t.Fatalf("reading the stored image: %v", err)
	}
	defer reader.Close()

	decoded, format, err := image.Decode(reader)
	if err != nil {
		s.t.Fatalf("decoding the stored image: %v", err)
	}
	if format != "png" {
		s.t.Fatalf("stored as %s; this test reads exact pixels and needs a lossless one", format)
	}

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
		{"the top-left quarter",
			models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}, 200, 300},
		{"the bottom-right quarter",
			models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}, 200, 300},
		{"a 2:3 frame out of a square",
			models.ImageCropInput{X: 0.25, Y: 0, Width: 0.5, Height: 0.75}, 400, 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			img, err := s.uploadCropped(tc.width, tc.height, &tc.crop)
			if !assert.NoError(t, err) {
				return
			}

			assert.Equal(t, int(tc.crop.Width*float64(tc.width)), img.Width)
			assert.Equal(t, int(tc.crop.Height*float64(tc.height)), img.Height)

			// Which region, not just how big. uploadCropped paints R from the
			// column and G from the row, so the middle of the stored crop names
			// the source pixel it was taken from. The two quarters below
			// differ by 100 and 150, far outside anything an encoder could do
			middle := s.storedPixel(img, 0.5, 0.5)

			sourceX := int(tc.crop.X*float64(tc.width)) + img.Width/2
			sourceY := int(tc.crop.Y*float64(tc.height)) + img.Height/2

			assert.Equal(t, uint8(sourceX%256), middle.R,
				"the crop came from column %d, not %d", int(middle.R), sourceX)
			assert.Equal(t, uint8(sourceY%256), middle.G,
				"the crop came from row %d, not %d", int(middle.G), sourceY)
		})
	}
}

// A crop that keeps everything should not re-encode: an upload nobody actually
// cropped must not pay a generation of quality for nothing
//
// Checked by deduplication rather than by dimensions, because a re-encode
// preserves the dimensions perfectly well. The same bytes uploaded with and
// without a full-frame crop have to land as one image, which they only can if
// the crop was skipped rather than performed
func TestImageCreateLeavesAFullFrameAlone(t *testing.T) {
	s := asAdmin(t)

	source := image.NewRGBA(image.Rect(0, 0, 120, 180))
	for y := range 180 {
		for x := range 120 {
			source.Set(x, y, color.RGBA{R: uint8(x % 256), G: uint8(y % 256), B: 31, A: 255})
		}
	}
	var buf bytes.Buffer
	assert.NoError(t, png.Encode(&buf, source))

	upload := func(crop *models.ImageCropInput) (*models.Image, error) {
		return s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
			File: &graphql.Upload{
				File:     bytes.NewReader(buf.Bytes()),
				Size:     int64(buf.Len()),
				Filename: "identity.png",
			},
			Crop: crop,
		})
	}

	plain, err := upload(nil)
	if !assert.NoError(t, err) {
		return
	}
	whole, err := upload(&models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1})
	if !assert.NoError(t, err) {
		return
	}

	assert.Equal(t, plain.ID, whole.ID,
		"a full-frame crop re-encoded the upload instead of leaving it alone")
	assert.Equal(t, 120, whole.Width)
	assert.Equal(t, 180, whole.Height)
}

// The property a browser crop would have lost: deduplication is on a checksum
// of the stored bytes, so the same source and the same frame have to produce
// the same bytes. We can only guarantee this by using one encoder, on one machine
func TestIdenticalCropsDeduplicate(t *testing.T) {
	s := asAdmin(t)

	source := image.NewRGBA(image.Rect(0, 0, 300, 400))
	for y := range 400 {
		for x := range 300 {
			source.Set(x, y, color.RGBA{R: uint8(x % 256), G: uint8(y % 256), B: 7, A: 255})
		}
	}
	var buf bytes.Buffer
	assert.NoError(t, png.Encode(&buf, source))

	upload := func(crop models.ImageCropInput) (*models.Image, error) {
		return s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
			File: &graphql.Upload{
				File:     bytes.NewReader(buf.Bytes()),
				Size:     int64(buf.Len()),
				Filename: "dedupe.png",
			},
			Crop: &crop,
		})
	}

	frame := models.ImageCropInput{X: 0.1, Y: 0.2, Width: 0.5, Height: 0.5}
	first, err := upload(frame)
	if !assert.NoError(t, err) {
		return
	}
	second, err := upload(frame)
	if !assert.NoError(t, err) {
		return
	}
	assert.Equal(t, first.ID, second.ID, "the same source and frame should be one image")

	// A different frame is a different image, or dedupe would be collapsing
	// things it should not
	other, err := upload(models.ImageCropInput{X: 0.4, Y: 0.2, Width: 0.5, Height: 0.5})
	if assert.NoError(t, err) {
		assert.NotEqual(t, first.ID, other.ID, "a different frame should be a different image")
	}
}

// Rotation grows the canvas to fit the turned image, and the frame is measured
// against that larger canvas. A quarter turn is the case with an exact answer:
// a 200x300 image becomes 300x200
func TestImageCreateRotatesBeforeCropping(t *testing.T) {
	s := asAdmin(t)

	quarter := 90.0
	img, err := s.uploadCropped(200, 300, &models.ImageCropInput{
		X: 0, Y: 0, Width: 1, Height: 1, Angle: &quarter,
	})
	if !assert.NoError(t, err) {
		return
	}

	assert.Equal(t, 300, img.Width, "a quarter turn should swap the sides")
	assert.Equal(t, 200, img.Height, "a quarter turn should swap the sides")
}

// A small angle grows the canvas rather than clipping the corners off, which is
// what lets a contributor straighten a horizon and still crop inside the result
func TestRotationGrowsTheCanvas(t *testing.T) {
	s := asAdmin(t)

	tilt := 10.0
	img, err := s.uploadCropped(200, 300, &models.ImageCropInput{
		X: 0, Y: 0, Width: 1, Height: 1, Angle: &tilt,
	})
	if !assert.NoError(t, err) {
		return
	}

	assert.Greater(t, img.Width, 200, "the canvas should have grown to fit the rotation")
	assert.Greater(t, img.Height, 300, "the canvas should have grown to fit the rotation")
}

func TestImageCreateRejectsUnusableFrames(t *testing.T) {
	s := asAdmin(t)

	tooFar := 180.0
	for _, tc := range []struct {
		name string
		crop models.ImageCropInput
	}{
		{"no area", models.ImageCropInput{X: 0, Y: 0, Width: 0, Height: 1}},
		{"runs off the edge", models.ImageCropInput{X: 0.8, Y: 0, Width: 0.5, Height: 1}},
		{"negative origin", models.ImageCropInput{X: -0.1, Y: 0, Width: 0.5, Height: 1}},
		{"turned too far", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: &tooFar}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			_, err := s.uploadCropped(200, 300, &tc.crop)
			assert.Error(t, err, "an unusable frame should be refused")
		})
	}
}

// Uploading without a crop has to keep working exactly as it did: every image
// in every existing instance arrived that way, and most still will
func TestImageCreateWithoutACropIsUnchanged(t *testing.T) {
	s := asAdmin(t)

	img, err := s.createTestImage(150, 250)
	if !assert.NoError(t, err) {
		return
	}
	assert.Equal(t, 150, img.Width)
	assert.Equal(t, 250, img.Height)
}

// exifOrientedJPEG encodes an image and declares an EXIF orientation for it,
// which is how a photograph off a phone arrives: the pixels are stored one way
// and a tag says which way up they go
//
// The APP1 segment is assembled by hand rather than pulled in from a library,
// because one tag in one IFD is a couple of dozen bytes and a dependency for
// that would be worse than the bytes
func exifOrientedJPEG(t *testing.T, img image.Image, orientation uint16) []byte {
	t.Helper()

	var encoded bytes.Buffer
	if err := jpeg.Encode(&encoded, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatalf("encoding: %v", err)
	}
	raw := encoded.Bytes()

	// A little-endian TIFF header, one IFD entry, and no next IFD.
	tiff := []byte{
		'I', 'I', 0x2a, 0x00, // byte order, and 42
		0x08, 0x00, 0x00, 0x00, // IFD0 starts 8 bytes in
		0x01, 0x00, // one entry
		0x12, 0x01, // tag 0x0112, Orientation
		0x03, 0x00, // type 3, SHORT
		0x01, 0x00, 0x00, 0x00, // one value
		byte(orientation), byte(orientation >> 8), 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00, // no next IFD
	}

	payload := append([]byte("Exif\x00\x00"), tiff...)
	// The length covers itself but not the marker.
	length := len(payload) + 2

	out := make([]byte, 0, len(raw)+length+2)
	out = append(out, raw[:2]...) // SOI
	out = append(out, 0xff, 0xe1, byte(length>>8), byte(length))
	out = append(out, payload...)
	out = append(out, raw[2:]...)
	return out
}

// Orientation 6 means the stored pixels are turned a quarter turn from how the
// image should be shown, which is what a phone held sideways produces. The
// client sends coordinates for what its browser drew, so the server has to put
// the image the same way up before measuring anything
//
// A tall 200x300 source displays as a wide 300x200. Its left half is therefore
// 150x200 and would be 100x300 if the tag were ignored, which is the bug this exists
// to catch
func TestImageCreateHonoursEXIFOrientation(t *testing.T) {
	s := asAdmin(t)

	source := image.NewRGBA(image.Rect(0, 0, 200, 300))
	for y := range 300 {
		for x := range 200 {
			source.Set(x, y, color.RGBA{R: uint8(x % 256), G: uint8(y % 256), B: 91, A: 255})
		}
	}
	data := exifOrientedJPEG(t, source, 6)

	img, err := s.resolver.Mutation().ImageCreate(s.ctx, models.ImageCreateInput{
		File: &graphql.Upload{
			File:     bytes.NewReader(data),
			Size:     int64(len(data)),
			Filename: "sideways.jpg",
		},
		Crop: &models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 1},
	})
	if !assert.NoError(t, err) {
		return
	}

	assert.Equal(t, 150, img.Width, "the orientation tag was ignored; a phone photo would crop sideways")
	assert.Equal(t, 200, img.Height, "the orientation tag was ignored; a phone photo would crop sideways")
}
