package image

import (
	"fmt"
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

func formatDims(images []models.Image) []string {
	if images == nil {
		return nil
	}
	dims := make([]string, len(images))
	for i, img := range images {
		dims[i] = fmt.Sprintf("%dx%d", img.Width, img.Height)
	}
	return dims
}

func TestOrderLandscape(t *testing.T) {
	tests := []struct {
		name     string
		images   []models.Image
		expected []models.Image
	}{
		{
			name: "Sorts by widest to most narrow aspect ratio",
			images: []models.Image{
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 400, Height: 600},   // 2:3 (0.666)
				{Width: 422, Height: 600},   // 0.703
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 600, Height: 400},   // 3:2 (1.5)
			},
			expected: []models.Image{
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 422, Height: 600},   // 0.703
				{Width: 400, Height: 600},   // 2:3 (0.666)
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
			},
		},
		{
			name: "Fallback to width descending when aspect ratio is identical",
			images: []models.Image{
				{Width: 500, Height: 1000},  // Aspect: 2.0, Width: 500
				{Width: 250, Height: 500},   // Aspect: 2.0, Width: 250
				{Width: 1000, Height: 2000}, // Aspect: 2.0, Width: 1000
			},
			expected: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 500, Height: 1000},
				{Width: 250, Height: 500},
			},
		},
		{
			name: "Handles zero dimensions safely",
			images: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 0, Height: 1000},
				{Width: 1000, Height: 0},
				{Width: 0, Height: 0},
			},
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Copy the input slice so we don't mutate the test case definition
			input := make([]models.Image, len(tt.images))
			copy(input, tt.images)

			OrderLandscape(input)

			if tt.expected != nil {
				assert.Equal(t, formatDims(tt.expected), formatDims(input))
			}
		})
	}
}

func TestOrderPortrait(t *testing.T) {
	tests := []struct {
		name     string
		images   []models.Image
		expected []models.Image
	}{
		{
			name: "Sorts by distance from 2:3 ratio",
			images: []models.Image{
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 400, Height: 600},   // 2:3 (0.666) (ideal)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 422, Height: 600},   // 0.703
			},
			expected: []models.Image{
				{Width: 400, Height: 600},   // 2:3 (0.666) (ideal)
				{Width: 422, Height: 600},   // 0.703
				{Width: 1080, Height: 1920}, // 9:16 (0.5625)
				{Width: 640, Height: 480},   // 4:3 (1.333)
				{Width: 600, Height: 400},   // 3:2 (1.5)
				{Width: 1920, Height: 1080}, // 16:9 (1.777)
			},
		},
		{
			name: "Fallback to height descending when aspect ratio is identical",
			images: []models.Image{
				{Width: 500, Height: 1000},  // Aspect: 2.0, Height: 1000
				{Width: 250, Height: 500},   // Aspect: 2.0, Height: 500
				{Width: 1000, Height: 2000}, // Aspect: 2.0, Height: 2000
			},
			expected: []models.Image{
				{Width: 1000, Height: 2000},
				{Width: 500, Height: 1000},
				{Width: 250, Height: 500},
			},
		},
		{
			name: "Handles zero dimensions safely",
			images: []models.Image{
				{Width: 0, Height: 1000},
				{Width: 1000, Height: 2000},
				{Width: 1000, Height: 0},
				{Width: 0, Height: 0},
			},
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Copy the input slice so we don't mutate the test case definition
			input := make([]models.Image, len(tt.images))
			copy(input, tt.images)

			OrderPortrait(input)

			if tt.expected != nil {
				assert.Equal(t, formatDims(tt.expected), formatDims(input))
			}
		})
	}
}
