package image

import (
	"math"
	"testing"
)

func full() CropRect { return CropRect{X: 0, Y: 0, Width: 1, Height: 1} }

func TestCropRectValidateAcceptsUsableFrames(t *testing.T) {
	for _, tc := range []struct {
		name string
		rect CropRect
	}{
		{"the whole image", full()},
		{"a corner", CropRect{X: 0, Y: 0, Width: 0.5, Height: 0.5}},
		{"flush against the far edge", CropRect{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}},
		{"a sliver", CropRect{X: 0.4, Y: 0.4, Width: 0.001, Height: 0.001}},
		{"straightening a horizon", CropRect{X: 0.1, Y: 0.1, Width: 0.8, Height: 0.8, Angle: 2.5}},
		{"turned the other way", CropRect{X: 0.1, Y: 0.1, Width: 0.8, Height: 0.8, Angle: -2.5}},
		{"a quarter turn, the most allowed", CropRect{X: 0, Y: 0, Width: 1, Height: 1, Angle: 90}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.rect.Validate(); err != nil {
				t.Errorf("rejected a usable frame: %v", err)
			}
		})
	}
}

func TestCropRectValidateRejectsUnusableFrames(t *testing.T) {
	for _, tc := range []struct {
		name string
		rect CropRect
	}{
		{"no width", CropRect{X: 0, Y: 0, Width: 0, Height: 1}},
		{"no height", CropRect{X: 0, Y: 0, Width: 1, Height: 0}},
		{"negative width", CropRect{X: 0, Y: 0, Width: -0.5, Height: 1}},
		{"starts left of the image", CropRect{X: -0.1, Y: 0, Width: 0.5, Height: 1}},
		{"starts above the image", CropRect{X: 0, Y: -0.1, Width: 1, Height: 0.5}},
		{"runs off the right", CropRect{X: 0.6, Y: 0, Width: 0.5, Height: 1}},
		{"runs off the bottom", CropRect{X: 0, Y: 0.6, Width: 1, Height: 0.5}},
		{"wider than the image", CropRect{X: 0, Y: 0, Width: 1.5, Height: 1}},
		{"turned too far", CropRect{X: 0, Y: 0, Width: 1, Height: 1, Angle: 91}},
		{"turned too far the other way", CropRect{X: 0, Y: 0, Width: 1, Height: 1, Angle: -91}},
		{"a position that is not a number", CropRect{X: math.NaN(), Y: 0, Width: 1, Height: 1}},
		{"a size that is not a number", CropRect{X: 0, Y: 0, Width: math.NaN(), Height: 1}},
		{"an infinite angle", CropRect{X: 0, Y: 0, Width: 1, Height: 1, Angle: math.Inf(1)}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if err := tc.rect.Validate(); err == nil {
				t.Error("accepted an unusable frame")
			}
		})
	}
}

func TestCropRectIsIdentity(t *testing.T) {
	if !full().IsIdentity() {
		t.Error("the whole image should be the identity")
	}
	for _, rect := range []CropRect{
		{X: 0, Y: 0, Width: 1, Height: 1, Angle: 1},
		{X: 0.1, Y: 0, Width: 0.9, Height: 1},
		{X: 0, Y: 0, Width: 1, Height: 0.9},
	} {
		if rect.IsIdentity() {
			t.Errorf("%+v should not be the identity", rect)
		}
	}
}

func TestCropRectPixels(t *testing.T) {
	for _, tc := range []struct {
		name                    string
		rect                    CropRect
		width, height           int
		left, top, wantW, wantH int
	}{
		{"the whole image", full(), 800, 1200, 0, 0, 800, 1200},
		{"the top-left quarter",
			CropRect{X: 0, Y: 0, Width: 0.5, Height: 0.5}, 800, 1200, 0, 0, 400, 600},
		{"the bottom-right quarter",
			CropRect{X: 0.5, Y: 0.5, Width: 0.5, Height: 0.5}, 800, 1200, 400, 600, 400, 600},
		{"a middle band",
			CropRect{X: 0.25, Y: 0.25, Width: 0.5, Height: 0.5}, 800, 1200, 200, 300, 400, 600},
	} {
		t.Run(tc.name, func(t *testing.T) {
			left, top, w, h := tc.rect.pixels(tc.width, tc.height)
			if left != tc.left || top != tc.top || w != tc.wantW || h != tc.wantH {
				t.Errorf("got (%d, %d) %dx%d, want (%d, %d) %dx%d",
					left, top, w, h, tc.left, tc.top, tc.wantW, tc.wantH)
			}
		})
	}
}

// Rounding a fraction onto whole pixels must never ask for a pixel past the
// edge which is what an extractor would refuse
func TestCropRectPixelsStayInsideTheImage(t *testing.T) {
	sizes := []int{1, 2, 3, 7, 33, 100, 799, 800, 1201}
	fractions := []float64{0, 0.001, 0.1, 1.0 / 3.0, 0.5, 0.667, 0.9, 0.999}

	for _, width := range sizes {
		for _, height := range sizes {
			for _, x := range fractions {
				for _, w := range fractions {
					if w <= 0 || x+w > 1 {
						continue
					}
					rect := CropRect{X: x, Y: x, Width: w, Height: w}
					if err := rect.Validate(); err != nil {
						continue
					}

					left, top, gotW, gotH := rect.pixels(width, height)
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
