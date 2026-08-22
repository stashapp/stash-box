package imagetype

import (
	"testing"

	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
)

// A two-group vocabulary in the shape the loader produces: CROP first, POSE
// second, each type at its own position within its group
//
// Built directly rather than loaded, which is the point of testing here at all:
// the ranking is pure, and fetching it from the database would make the cheapest
// logic in the package the most expensive thing to check
func testVocabulary() *Vocabulary {
	return &Vocabulary{
		groupPosition: map[string]int{"CROP": 0, "POSE": 1},
		groupCount:    2,
		typePosition: map[models.ImageTypeEnum]int{
			models.ImageTypeEnumCropFace:     0,
			models.ImageTypeEnumCropBust:     1,
			models.ImageTypeEnumCropFullBody: 2,
			models.ImageTypeEnumViewFront:    0,
			models.ImageTypeEnumViewBack:     1,
		},
		typeGroup: map[models.ImageTypeEnum]string{
			models.ImageTypeEnumCropFace:     "CROP",
			models.ImageTypeEnumCropBust:     "CROP",
			models.ImageTypeEnumCropFullBody: "CROP",
			models.ImageTypeEnumViewFront:    "POSE",
			models.ImageTypeEnumViewBack:     "POSE",
		},
	}
}

func equal(got, want image.RankTuple) bool {
	if len(got) != len(want) {
		return false
	}
	for i := range got {
		if got[i] != want[i] {
			return false
		}
	}
	return true
}

func TestRank(t *testing.T) {
	v := testVocabulary()

	for _, tc := range []struct {
		name  string
		types []models.ImageTypeEnum
		want  image.RankTuple
	}{
		{
			"nothing at all",
			nil,
			image.RankTuple{image.Unranked, image.Unranked},
		},
		{
			"one group answered",
			[]models.ImageTypeEnum{models.ImageTypeEnumCropFace},
			image.RankTuple{0, image.Unranked},
		},
		{
			"both groups answered",
			[]models.ImageTypeEnum{models.ImageTypeEnumCropBust, models.ImageTypeEnumViewBack},
			image.RankTuple{1, 1},
		},
		{
			// The order the assignment query happens to return must not change
			// the answer. FindImageTypesByPerformerIds orders by sort_order, so
			// last-write-wins would have taken the lowest-priority type.
			// Two-from-one-group is not reachable through the API, because
			// every group is exclusive but that is a property of the seed
			// data and of the validators, not of the schema, so the ranking
			// has to behave when it happens anyway
			"two from one group, best first",
			[]models.ImageTypeEnum{models.ImageTypeEnumCropFace, models.ImageTypeEnumCropFullBody},
			image.RankTuple{0, image.Unranked},
		},
		{
			"two from one group, best last",
			[]models.ImageTypeEnum{models.ImageTypeEnumCropFullBody, models.ImageTypeEnumCropFace},
			image.RankTuple{0, image.Unranked},
		},
		{
			// A type the instance has switched off is missing from typeGroup
			// entirely, and simply stops counting
			"a type outside the vocabulary",
			[]models.ImageTypeEnum{models.ImageTypeEnumDressNude, models.ImageTypeEnumViewFront},
			image.RankTuple{image.Unranked, 0},
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if got := v.Rank(tc.types); !equal(got, tc.want) {
				t.Errorf("Rank(%v) = %v, want %v", tc.types, got, tc.want)
			}
		})
	}
}
