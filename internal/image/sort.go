package image

import (
	"cmp"
	"math"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

// Unranked is the tuple component for an image carrying no type from a group:
// such images sort last within that dimension
const Unranked = math.MaxInt

// RankTuple orders an image against the instance's vocabulary, one component
// per group in group priority order. Tuples compare lexicographically.
type RankTuple []int

// at reads a component, treating a missing one as Unranked, so an image with no
// assignments can be absent from the ranks map entirely.
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

// Compare orders images by rank, organized status, date, then portrait shape.
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

// Sorts by "most" to "least" landscape, i.e. largest to smallest aspect ratio; ties broken by largest --> smallest width.
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
