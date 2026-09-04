package image

import (
	"math"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

// Unranked is the tuple component for an image carrying no type from a group.
// Such images sort last within that dimension.
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

func (t RankTuple) before(other RankTuple) bool {
	for i := range max(len(t), len(other)) {
		if a, b := t.at(i), other.at(i); a != b {
			return a < b
		}
	}
	return false
}

// OrderByType sorts images by their rank tuple, breaking ties with the
// entity's existing comparator
//
// The sort must stay stable: equally-ranked images would otherwise come back in
// an arbitrary order, which surfaces as the primary image changing when nobody
// edited anything
func OrderByType(images []models.Image, ranks map[uuid.UUID]RankTuple, tiebreak func([]models.Image)) {
	tiebreak(images)

	sort.SliceStable(images, func(a, b int) bool {
		return ranks[images[a].ID].before(ranks[images[b].ID])
	})
}

// NewestFirst wraps a tiebreak so that images equally ranked come back most
// recent first, undated last
//
// Dates are partial ISO 8601 and compare as strings: "2019" < "2019-06" <
// "2019-06-15", so a bare year sorts as the start of its year. Nothing needs
// parsing and there is no timezone to be wrong about
func NewestFirst(dates map[uuid.UUID]*string, tiebreak func([]models.Image)) func([]models.Image) {
	return func(images []models.Image) {
		tiebreak(images)

		sort.SliceStable(images, func(a, b int) bool {
			left, right := dates[images[a].ID], dates[images[b].ID]
			if left == nil || right == nil {
				return left != nil && right == nil
			}
			return *left > *right
		})
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

// Sorts by distance from ideal aspect ratio of 2:3; ties broken by largest --> smallest height.
func OrderPortrait(p []models.Image) {
	sort.Slice(p, func(a, b int) bool {
		if p[a].Height == 0 || p[b].Height == 0 {
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
