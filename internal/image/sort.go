package image

import (
	"math"
	"sort"

	"github.com/stashapp/stash-box/internal/models"
)

func OrderLandscape(p []models.Image) {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Height == 0 || p[b].Height == 0 {
			return false
		}
		aspectA := p[a].Width / p[a].Height
		aspectB := p[b].Width / p[b].Height
		if aspectA > aspectB {
			return true
		} else if aspectA < aspectB {
			return false
		}
		return p[a].Width > p[b].Width
	})
}

// Sorts by distance from StashDB's ideal aspect ratio of 2:3; ties broken by largest --> smallest height.
func OrderPortrait(p []models.Image) {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Width == 0 || p[b].Width == 0 {
			return false
		}
		aspectA := float64(p[a].Width) / float64(p[a].Height)
		aspectB := float64(p[b].Width) / float64(p[b].Height)
		aspectIdeal := 2.0 / 3.0
		diffA := math.Abs(aspectA - aspectIdeal)
		diffB := math.Abs(aspectB - aspectIdeal)
		if diffA < diffB {
			return true
		} else if diffA > diffB {
			return false
		}
		return p[a].Height > p[b].Height
	})
}
