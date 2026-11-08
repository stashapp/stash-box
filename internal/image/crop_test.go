package image

import (
	"math"
	"testing"

	"github.com/stashapp/stash-box/internal/models"
)

func full() models.ImageCropInput { return models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1} }

func TestValidateCrop(t *testing.T) {
	for _, tc := range []struct {
		name    string
		rect    models.ImageCropInput
		wantErr bool
	}{
		{"the whole image", full(), false},
		{"a corner", models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}, false},
		{"flush against the far edge", models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}, false},
		{"a sliver", models.ImageCropInput{X: 0.4, Y: 0.4, Width: 0.001, Height: 0.001}, false},
		{"straightening a horizon", models.ImageCropInput{X: 0.1, Y: 0.1, Width: 0.8, Height: 0.8, Angle: 2.5}, false},
		{"turned the other way", models.ImageCropInput{X: 0.1, Y: 0.1, Width: 0.8, Height: 0.8, Angle: -2.5}, false},
		{"a quarter turn, the most allowed", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: 90}, false},
		{"no width", models.ImageCropInput{X: 0, Y: 0, Width: 0, Height: 1}, true},
		{"no height", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 0}, true},
		{"negative width", models.ImageCropInput{X: 0, Y: 0, Width: -0.5, Height: 1}, true},
		{"starts left of the image", models.ImageCropInput{X: -0.1, Y: 0, Width: 0.5, Height: 1}, true},
		{"starts above the image", models.ImageCropInput{X: 0, Y: -0.1, Width: 1, Height: 0.5}, true},
		{"runs off the right", models.ImageCropInput{X: 0.6, Y: 0, Width: 0.5, Height: 1}, true},
		{"runs off the bottom", models.ImageCropInput{X: 0, Y: 0.6, Width: 1, Height: 0.5}, true},
		{"wider than the image", models.ImageCropInput{X: 0, Y: 0, Width: 1.5, Height: 1}, true},
		{"turned too far", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: 91}, true},
		{"turned too far the other way", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: -91}, true},
		{"a position that is not a number", models.ImageCropInput{X: math.NaN(), Y: 0, Width: 1, Height: 1}, true},
		{"a size that is not a number", models.ImageCropInput{X: 0, Y: 0, Width: math.NaN(), Height: 1}, true},
		{"an infinite angle", models.ImageCropInput{X: 0, Y: 0, Width: 1, Height: 1, Angle: math.Inf(1)}, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := validateCrop(tc.rect)
			if (err != nil) != tc.wantErr {
				t.Errorf("got %v, wantErr %v", err, tc.wantErr)
			}
		})
	}
}

func TestCropIsIdentity(t *testing.T) {
	if !IsIdentity(full()) {
		t.Error("the whole image should be the identity")
	}
	for _, rect := range []models.ImageCropInput{
		{X: 0, Y: 0, Width: 1, Height: 1, Angle: 1},
		{X: 0.1, Y: 0, Width: 0.9, Height: 1},
		{X: 0, Y: 0, Width: 1, Height: 0.9},
	} {
		if IsIdentity(rect) {
			t.Errorf("%+v should not be the identity", rect)
		}
	}
}

func TestCropPixels(t *testing.T) {
	for _, tc := range []struct {
		name                    string
		rect                    models.ImageCropInput
		width, height           int
		left, top, wantW, wantH int
	}{
		{"the whole image", full(), 800, 1200, 0, 0, 800, 1200},
		{"the top-left quarter",
			models.ImageCropInput{X: 0, Y: 0, Width: 0.5, Height: 0.5}, 800, 1200, 0, 0, 400, 600},
		{"the bottom-right quarter",
			models.ImageCropInput{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}, 800, 1200, 400, 600, 400, 600},
		{"a middle band",
			models.ImageCropInput{X: 0.25, Y: 0.25, Width: 0.5, Height: 0.5}, 800, 1200, 200, 300, 400, 600},
	} {
		t.Run(tc.name, func(t *testing.T) {
			left, top, w, h := cropPixels(tc.rect, tc.width, tc.height)
			if left != tc.left || top != tc.top || w != tc.wantW || h != tc.wantH {
				t.Errorf("got (%d, %d) %dx%d, want (%d, %d) %dx%d",
					left, top, w, h, tc.left, tc.top, tc.wantW, tc.wantH)
			}
		})
	}
}

// Rounding onto whole pixels must never reach past the edge
func TestCropPixelsStayInsideTheImage(t *testing.T) {
	sizes := []int{1, 2, 3, 7, 33, 100, 799, 800, 1201}
	fractions := []float64{0, 0.001, 0.1, 1.0 / 3.0, 0.5, 0.667, 0.9, 0.999}

	for _, width := range sizes {
		for _, height := range sizes {
			for _, x := range fractions {
				for _, w := range fractions {
					if w <= 0 || x+w > 1 {
						continue
					}
					rect := models.ImageCropInput{X: x, Y: x, Width: w, Height: w}
					if err := validateCrop(rect); err != nil {
						continue
					}

					left, top, gotW, gotH := cropPixels(rect, width, height)
					if left < 0 || top < 0 || gotW < 1 || gotH < 1 {
						t.Fatalf("%dx%d %+v gave (%d, %d) %dx%d", width, height, rect, left, top, gotW, gotH)
					}
					if left+gotW > width || top+gotH > height {
						t.Fatalf("%dx%d %+v reaches past the edge: (%d, %d) %dx%d",
							width, height, rect, left, top, gotW, gotH)
					}
				}
			}
		}
	}
}
