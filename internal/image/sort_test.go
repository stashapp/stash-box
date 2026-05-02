package image

import (
	"reflect"
	"testing"

	"github.com/stashapp/stash-box/internal/models"
)

// TODO: Add tests for OrderLandscape

func TestOrderPortrait(t *testing.T) {
	tests := []struct {
		name     string
		images   []models.Image
		expected []models.Image
	}{
		{
			name: "Sorts by distance from 2:3 ratio",
			images: []models.Image{
				{Width: 720, Height: 480}, // 4:3 (1.333)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 400, Height: 600}, // 2:3 (0.666) (ideal)
				{Width: 600, Height: 400}, // 3:2 (1.5)
				{Width: 422, Height: 600}, // 0.536
			},
			expected: []models.Image{
				{Width: 400, Height: 600}, // 2:3 (0.666) (ideal)
				{Width: 422, Height: 600}, // 0.536
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 720, Height: 480}, // 4:3 (1.333)
				{Width: 600, Height: 400}, // 3:2 (1.5)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
			},
		},
		{
			name: "Fallback to height descending when aspect ratio is identical",
			images: []models.Image{
				{Width: 500, Height: 1000},  // Aspect: 2.0, Height: 1000
				{Width: 250, Height: 500},  // Aspect: 2.0, Height: 500
				{Width: 1000, Height: 2000}, // Aspect: 2.0, Height: 2000
			},
			expected: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 500, Height: 1000},
				{Width: 250, Height: 500},
			},
		},
		{
			name: "Handles zero width safely",
			images: []models.Image{
				{Width: 0, Height: 1000},
				{Width: 1000, Height: 2000},
			},
			// The current sort logic returns false when a width is 0,
			// meaning it won't swap them. It preserves the existing order relative to each other.
			expected: []models.Image{
				{Width: 0, Height: 1000},
				{Width: 1000, Height: 2000},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Copy the input slice so we don't mutate the test case definition
			input := make([]models.Image, len(tt.images))
			copy(input, tt.images)

			OrderPortrait(input)

			if !reflect.DeepEqual(input, tt.expected) {
				t.Errorf("OrderPortrait() = %v\nwant %v", input, tt.expected)
			}
		})
	}
}
