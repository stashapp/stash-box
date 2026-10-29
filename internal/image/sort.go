package image

import (
	"cmp"
	"math"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

// Unranked places images without a type last within that group.
const Unranked = math.MaxInt

// RankTuple contains type priorities in group order.
type RankTuple []int

// Missing components compare as Unranked.
func (t RankTuple) at(i int) int {
	if i < len(t) {
		return t[i]
	}
	return Unranked
}

func (t RankTuple) compare(other RankTuple) int {
	for i := range max(len(t), len(other)) {
		if result := cmp.Compare(t.at(i), other.at(i)); result != 0 {
			return result
		}
	}
	return 0
}

// Compare orders images by rank, organized status, newest date, then portrait shape.
func Compare(ranks map[uuid.UUID]RankTuple) func(models.Image, models.Image) int {
	return func(a, b models.Image) int {
		if result := ranks[a.ID].compare(ranks[b.ID]); result != 0 {
			return result
		}
		if a.Organized != b.Organized {
			if a.Organized {
				return -1
			}
			return 1
		}
		if a.Date == nil && b.Date != nil {
			return 1
		}
		if a.Date != nil && b.Date == nil {
			return -1
		}
		if a.Date != nil && b.Date != nil {
			if result := cmp.Compare(*b.Date, *a.Date); result != 0 {
				return result
			}
		}
		return comparePortrait(a, b)
	}
}

// OrderLandscape sorts by aspect ratio descending, then width descending.
func OrderLandscape(p []models.Image) {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Height == 0 || p[b].Height == 0 {
			return false
		}
		aspectA := float64(p[a].Width) / float64(p[a].Height)
		aspectB := float64(p[b].Width) / float64(p[b].Height)
		if aspectA > aspectB {
			return true
		} else if aspectA < aspectB {
			return false
		}
		return p[a].Width > p[b].Width
	})
}

func comparePortrait(a, b models.Image) int {
	if a.Height == 0 || b.Height == 0 {
		return 0
	}
	const ideal = 2.0 / 3.0
	distanceA := math.Abs(float64(a.Width)/float64(a.Height) - ideal)
	distanceB := math.Abs(float64(b.Width)/float64(b.Height) - ideal)
	if result := cmp.Compare(distanceA, distanceB); result != 0 {
		return result
	}
	return cmp.Compare(b.Height, a.Height)
}
