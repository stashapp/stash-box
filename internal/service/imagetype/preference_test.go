package imagetype

import (
	"slices"
	"sort"
	"testing"

	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// groupOrder and typeOrder read a vocabulary back as the two orderings it
// encodes. The positions themselves are an implementation detail; what decides
// what a viewer sees is which dimension is compared before which, and which
// type wins inside one
func groupOrder(v *Vocabulary) []string {
	groups := make([]string, 0, len(v.groupPosition))
	for key := range v.groupPosition {
		groups = append(groups, key)
	}
	sort.Slice(groups, func(a, b int) bool {
		return v.groupPosition[groups[a]] < v.groupPosition[groups[b]]
	})
	return groups
}

func typeOrder(v *Vocabulary, group string) []models.ImageTypeEnum {
	var types []models.ImageTypeEnum
	for imageType, groupKey := range v.typeGroup {
		if groupKey == group {
			types = append(types, imageType)
		}
	}
	sort.Slice(types, func(a, b int) bool {
		return v.typePosition[types[a]] < v.typePosition[types[b]]
	})
	return types
}

// A type preference reorders within dimensions and must not touch the
// dimensions themselves, or a user expressing a taste in crops would silently
// change what is compared first
func TestWithPreferenceLeavesGroupsAndOtherDimensionsAlone(t *testing.T) {
	v := testVocabulary().withPreference([]models.ImageTypeEnum{
		models.ImageTypeEnumCropFullBody,
	})

	if got, want := groupOrder(v), []string{"CROP", "POSE"}; !slices.Equal(got, want) {
		t.Errorf("group order = %v, want %v", got, want)
	}

	want := []models.ImageTypeEnum{models.ImageTypeEnumViewFront, models.ImageTypeEnumViewBack}
	if got := typeOrder(v, "POSE"); !slices.Equal(got, want) {
		t.Errorf("POSE order = %v, want %v", got, want)
	}
}

// Preferences are stored per user and the vocabulary can change under them: an
// admin switches a type off and every preference naming it is now stale. A
// stored preference must not put a type back into a vocabulary that no longer
// ranks it
//
// Two things currently stop it: the explicit skip, and the fact that
// positions are handed out over v.groupPosition, which a phantom group is not
// in. So this asserts the property rather than either mechanism, and stays
// honest if one of them goes
func TestWithPreferenceIgnoresTypesOutsideTheVocabulary(t *testing.T) {
	v := testVocabulary().withPreference([]models.ImageTypeEnum{
		models.ImageTypeEnumDressNude, // not in this vocabulary at all
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropFullBody,
	})

	want := []models.ImageTypeEnum{
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropFullBody,
		models.ImageTypeEnumCropFace, // the only one left, in instance order
	}
	if got := typeOrder(v, "CROP"); !slices.Equal(got, want) {
		t.Errorf("CROP order = %v, want %v", got, want)
	}

	if _, ranked := v.typePosition[models.ImageTypeEnumDressNude]; ranked {
		t.Error("a type outside the vocabulary was given a position")
	}
}

// A repeat cannot be seen in the ordering -- positions 1,2,3 sort exactly as
// 0,1,2, since only the relative order within a group is ever compared. So this
// looks at the positions themselves, which is the only way to tell the dedupe
// is still there. Contrast the group case below, where the same gap is fatal
func TestWithPreferenceNumbersTypesWithoutGaps(t *testing.T) {
	v := testVocabulary().withPreference([]models.ImageTypeEnum{
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropBust, // repeat
		models.ImageTypeEnumCropFullBody,
	})

	for position, imageType := range typeOrder(v, "CROP") {
		if got := v.typePosition[imageType]; got != position {
			t.Errorf("%v is at position %d, want %d", imageType, got, position)
		}
	}
}

// The group preference is the stronger of the two: type order only breaks ties
// inside a dimension, so moving a dimension decides what is compared at all.
func TestWithGroupPreferenceReordersDimensionsAndKeepsTypeOrder(t *testing.T) {
	v := testVocabulary().withGroupPreference([]string{"POSE"})

	if got, want := groupOrder(v), []string{"POSE", "CROP"}; !slices.Equal(got, want) {
		t.Errorf("group order = %v, want %v", got, want)
	}

	want := []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropFullBody,
	}
	if got := typeOrder(v, "CROP"); !slices.Equal(got, want) {
		t.Errorf("CROP order = %v, want %v", got, want)
	}
}

// An unknown or repeated group is not a cosmetic problem the way an unknown or
// repeated type is. Positions are handed out over the preference list, but the
// tuple is allocated to groupCount, so either one pushes a real group past the
// end of the tuple and Rank panics on an index out of range inside a GraphQL
// resolver, on a stale preference the user cannot see.
//
// Asserted through Rank rather than through groupPosition, because that is
// where it would actually go wrong
func TestWithGroupPreferenceIgnoresUnknownAndRepeatedGroups(t *testing.T) {
	for _, tc := range []struct {
		name      string
		preferred []string
	}{
		{"a group this instance does not have", []string{"DRESS", "POSE"}},
		{"the same group twice", []string{"POSE", "POSE"}},
	} {
		t.Run(tc.name, func(t *testing.T) {
			v := testVocabulary().withGroupPreference(tc.preferred)

			if got, want := groupOrder(v), []string{"POSE", "CROP"}; !slices.Equal(got, want) {
				t.Errorf("group order = %v, want %v", got, want)
			}
			if v.groupCount != 2 {
				t.Errorf("groupCount = %d, want 2 - the tuple width must not follow a preference", v.groupCount)
			}

			// Every group must still index inside a groupCount-wide tuple.
			got := v.Rank([]models.ImageTypeEnum{
				models.ImageTypeEnumCropFace,
				models.ImageTypeEnumViewBack,
			})
			if want := (image.RankTuple{1, 0}); !equal(got, want) {
				t.Errorf("Rank = %v, want %v (POSE now leads)", got, want)
			}
		})
	}
}

// Each preference carries the other's work forward rather than rebuilding from
// the instance ordering, so the two compose in either order. VocabularyFor
// applies groups first; this is what says it could apply them second and get
// the same vocabulary
func TestPreferencesComposeInEitherOrder(t *testing.T) {
	groupsFirst := testVocabulary().
		withGroupPreference([]string{"POSE"}).
		withPreference([]models.ImageTypeEnum{models.ImageTypeEnumCropFullBody})

	typesFirst := testVocabulary().
		withPreference([]models.ImageTypeEnum{models.ImageTypeEnumCropFullBody}).
		withGroupPreference([]string{"POSE"})

	if got, want := groupOrder(typesFirst), groupOrder(groupsFirst); !slices.Equal(got, want) {
		t.Errorf("group order depends on the order applied: %v then %v", want, got)
	}
	for _, group := range []string{"CROP", "POSE"} {
		got, want := typeOrder(typesFirst, group), typeOrder(groupsFirst, group)
		if !slices.Equal(got, want) {
			t.Errorf("%s order depends on the order applied: %v then %v", group, want, got)
		}
	}

	// And that the composed result is actually both preferences, not one of
	// them silently winning
	if got, want := groupOrder(groupsFirst), []string{"POSE", "CROP"}; !slices.Equal(got, want) {
		t.Errorf("group order = %v, want %v", got, want)
	}
	if got := typeOrder(groupsFirst, "CROP")[0]; got != models.ImageTypeEnumCropFullBody {
		t.Errorf("CROP leads with %v, want the preferred CROP_FULL_BODY", got)
	}
}

// Thumbnails rank against Instance() (resolver_model_performer.go), which is
// what lets the field be the same for every viewer and therefore cacheable.
// Instance() must stay one hop from the unadjusted ordering however many
// preferences are layered on, otherwise if a layer ever pointed at an
// already-adjusted vocabulary thumbnails would quietly become viewer-dependent
func TestInstanceStaysUnadjustedUnderEveryLayer(t *testing.T) {
	base := testVocabulary()

	layered := base.
		withGroupPreference([]string{"POSE"}).
		withPreference([]models.ImageTypeEnum{models.ImageTypeEnumCropFullBody}).
		withGroupPreference([]string{"CROP"}).
		withPreference([]models.ImageTypeEnum{models.ImageTypeEnumViewBack})

	if layered.Instance() != base {
		t.Error("Instance() no longer reaches the vocabulary the preferences were built from")
	}

	if got, want := groupOrder(base), []string{"CROP", "POSE"}; !slices.Equal(got, want) {
		t.Errorf("the instance ordering was mutated: groups %v, want %v", got, want)
	}
	want := []models.ImageTypeEnum{
		models.ImageTypeEnumCropFace,
		models.ImageTypeEnumCropBust,
		models.ImageTypeEnumCropFullBody,
	}
	if got := typeOrder(base, "CROP"); !slices.Equal(got, want) {
		t.Errorf("the instance ordering was mutated: CROP %v, want %v", got, want)
	}
}

// Position is what counts and the primary key forbids repeats, so a later
// duplicate says nothing the first did not
func TestPreferenceParamsNumbersInOrderAndDropsRepeats(t *testing.T) {
	params := preferenceParams(
		[]models.ImageTypeEnum{
			models.ImageTypeEnumCropFace,
			models.ImageTypeEnumCropBust,
			models.ImageTypeEnumCropFace,
			models.ImageTypeEnumCropFullBody,
		},
		func(key string, sortOrder int) queries.CreateUserImageTypePreferencesParams {
			return queries.CreateUserImageTypePreferencesParams{TypeKey: key, SortOrder: sortOrder}
		},
	)

	want := []queries.CreateUserImageTypePreferencesParams{
		{TypeKey: "CROP_FACE", SortOrder: 0},
		{TypeKey: "CROP_BUST", SortOrder: 1},
		{TypeKey: "CROP_FULL_BODY", SortOrder: 2},
	}
	if !slices.Equal(params, want) {
		t.Errorf("preferenceParams = %v, want %v", params, want)
	}
}
