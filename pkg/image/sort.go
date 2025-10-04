package image

import (
	"sort"

	"github.com/stashapp/stash-box/pkg/models"
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

func OrderPortrait(p []models.Image) {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Width == 0 || p[b].Width == 0 {
			return false
		}
		aspectA := p[a].Height / p[a].Width
		aspectB := p[b].Height / p[b].Width
		if aspectA > aspectB {
			return true
		} else if aspectA < aspectB {
			return false
		}
		return p[a].Height > p[b].Height
	})
}
