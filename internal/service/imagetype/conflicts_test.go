package imagetype

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

func TestOneSidedConflicts(t *testing.T) {
	types := []queries.ImageType{
		{Key: "CROP_FACE", Conflicts: []string{"DRESS_TOPLESS"}},
		{Key: "DRESS_TOPLESS"},
		{Key: "VIEW_FRONT"},
	}
	pairs, err := loadConflictPairs(types)
	if err != nil {
		t.Fatal(err)
	}
	for _, selected := range [][]models.ImageTypeEnum{
		{models.ImageTypeEnumCropFace, models.ImageTypeEnumDressTopless},
		{models.ImageTypeEnumDressTopless, models.ImageTypeEnumCropFace},
	} {
		if err := conflictBetween(uuid.Nil, selected, pairs); err == nil {
			t.Fatalf("expected conflict for %v", selected)
		}
	}
	if err := conflictBetween(uuid.Nil, []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace, models.ImageTypeEnumViewFront,
	}, pairs); err != nil {
		t.Fatal(err)
	}
}

func TestInvalidConflictDeclarations(t *testing.T) {
	for _, other := range []string{"UNKNOWN", "CROP_FACE"} {
		t.Run(other, func(t *testing.T) {
			_, err := loadConflictPairs([]queries.ImageType{
				{Key: "CROP_FACE", Conflicts: []string{other}},
			})
			if err == nil {
				t.Fatal("expected invalid conflict declaration to fail")
			}
		})
	}
}
