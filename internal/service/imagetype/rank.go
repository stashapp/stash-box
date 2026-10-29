package imagetype

import (
	"context"
	"fmt"
	"slices"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// Ranking describes group priority and type priority within each group.
// Preferences create adjusted copies without modifying the instance ranking.
type Ranking struct {
	// Tuple position of each group, in group priority order
	groupPosition map[string]int
	groupCount    int
	// Priority of each type within its group
	typePosition map[models.ImageTypeEnum]int
	typeGroup    map[models.ImageTypeEnum]string
}

// RankingFor reads the ordering as one user sees it: the instance ordering
// with that user's preference applied. Callers pass the viewer, which is how
// scraping gets its owner's ordering without changing its query
func (s *ImageType) RankingFor(ctx context.Context, userID uuid.UUID) (*Ranking, error) {
	ranking, err := s.InstanceRanking(ctx)
	if err != nil {
		return nil, err
	}

	preferred, err := s.queries.GetUserImageTypePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	preferredGroups, err := s.queries.GetUserImageTypeGroupPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	if len(preferred) == 0 && len(preferredGroups) == 0 {
		return ranking, nil
	}

	// The two compose in either order; groups go first as the stronger one
	if len(preferredGroups) > 0 {
		ranking = ranking.withGroupPreference(preferredGroups)
	}

	if len(preferred) > 0 {
		types := make([]models.ImageTypeEnum, len(preferred))
		for i, key := range preferred {
			types[i] = models.ImageTypeEnum(key)
		}
		ranking = ranking.withPreference(types)
	}

	return ranking, nil
}

// withPreference reorders types within each group, leaving the group order to
// whatever the caller already decided. Types the user did not list trail the
// ones they did, in instance order, so a partial preference is well defined
func (v *Ranking) withPreference(preferred []models.ImageTypeEnum) *Ranking {
	preferredInGroup := make(map[string][]models.ImageTypeEnum, len(v.groupPosition))
	listed := make(map[models.ImageTypeEnum]struct{}, len(preferred))

	for _, imageType := range preferred {
		groupKey, known := v.typeGroup[imageType]
		if !known {
			continue
		}
		if _, duplicate := listed[imageType]; duplicate {
			continue
		}
		listed[imageType] = struct{}{}
		preferredInGroup[groupKey] = append(preferredInGroup[groupKey], imageType)
	}

	// Instance order within each group, to fill in behind the listed ones
	remainingInGroup := make(map[string][]models.ImageTypeEnum, len(v.groupPosition))
	for imageType, groupKey := range v.typeGroup {
		if _, wasListed := listed[imageType]; wasListed {
			continue
		}
		remainingInGroup[groupKey] = append(remainingInGroup[groupKey], imageType)
	}
	for groupKey := range remainingInGroup {
		remaining := remainingInGroup[groupKey]
		sort.Slice(remaining, func(a, b int) bool {
			return v.typePosition[remaining[a]] < v.typePosition[remaining[b]]
		})
	}

	adjusted := &Ranking{
		groupPosition: v.groupPosition,
		groupCount:    v.groupCount,
		typePosition:  make(map[models.ImageTypeEnum]int, len(v.typePosition)),
		typeGroup:     v.typeGroup,
	}

	for groupKey := range v.groupPosition {
		position := 0
		for _, imageType := range append(preferredInGroup[groupKey], remainingInGroup[groupKey]...) {
			adjusted.typePosition[imageType] = position
			position++
		}
	}

	return adjusted
}

// withGroupPreference reorders the dimensions themselves, deciding what is
// compared before what. Groups the user did not list trail the ones they did,
// in instance order, exactly as unlisted types do
//
// The stronger of the two preferences: type order only breaks ties inside a
// dimension. Thumbnails rank against the cached instance vocabulary directly.
func (v *Ranking) withGroupPreference(preferred []string) *Ranking {
	ordered := make([]string, 0, len(v.groupPosition))
	listed := make(map[string]struct{}, len(preferred))

	for _, groupKey := range preferred {
		if _, known := v.groupPosition[groupKey]; !known {
			continue
		}
		if _, duplicate := listed[groupKey]; duplicate {
			continue
		}
		listed[groupKey] = struct{}{}
		ordered = append(ordered, groupKey)
	}

	var remaining []string
	for groupKey := range v.groupPosition {
		if _, wasListed := listed[groupKey]; !wasListed {
			remaining = append(remaining, groupKey)
		}
	}
	sort.Slice(remaining, func(a, b int) bool {
		return v.groupPosition[remaining[a]] < v.groupPosition[remaining[b]]
	})

	adjusted := &Ranking{
		groupPosition: make(map[string]int, len(v.groupPosition)),
		groupCount:    v.groupCount,
		typePosition:  v.typePosition,
		typeGroup:     v.typeGroup,
	}

	for position, groupKey := range append(ordered, remaining...) {
		adjusted.groupPosition[groupKey] = position
	}

	return adjusted
}

// Rank builds one image's tuple: for each group, the position of the image's
// best type in it, or Unranked
//
// "Best" rather than "only" because exclusivity is enforced by the validators
// and the seed data, not by the schema: an image that has ended up with two
// values from one group sorts by the better of them rather than by whichever
// the query returned last
func (v *Ranking) Rank(types []models.ImageTypeEnum) image.RankTuple {
	tuple := make(image.RankTuple, v.groupCount)
	for i := range tuple {
		tuple[i] = image.Unranked
	}

	for _, imageType := range types {
		groupKey, known := v.typeGroup[imageType]
		if !known {
			continue
		}

		position, ranked := v.groupPosition[groupKey]
		if !ranked {
			continue
		}

		tuple[position] = min(tuple[position], v.typePosition[imageType])
	}

	return tuple
}

// RanksByImage ranks labels already grouped by image.
func (v *Ranking) RanksByImage(typesByImage map[uuid.UUID][]models.ImageTypeEnum) map[uuid.UUID]image.RankTuple {
	return v.ranksByImage(typesByImage, v.Rank)
}

func (v *Ranking) ranksByImage(
	typesByImage map[uuid.UUID][]models.ImageTypeEnum,
	rank func([]models.ImageTypeEnum) image.RankTuple,
) map[uuid.UUID]image.RankTuple {
	ranks := make(map[uuid.UUID]image.RankTuple, len(typesByImage))
	for imageID, types := range typesByImage {
		ranks[imageID] = rank(types)
	}
	return ranks
}

// Preferences returns a user's preferred type order, empty if they have none
func (s *ImageType) Preferences(ctx context.Context, userID uuid.UUID) ([]models.ImageTypeEnum, error) {
	keys, err := s.queries.GetUserImageTypePreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	types := make([]models.ImageTypeEnum, len(keys))
	for i, key := range keys {
		types[i] = models.ImageTypeEnum(key)
	}
	return types, nil
}

// SetPreferences replaces a user's ordering, types and groups together
//
// The type list is required by the schema, and an empty one clears it. Groups
// are optional, and nil leaves whatever the user already had
func (s *ImageType) SetPreferences(
	ctx context.Context,
	userID uuid.UUID,
	types []models.ImageTypeEnum,
	groups []models.ImageTypeGroupEnum,
) error {
	return s.withTxn(func(tx *queries.Queries) error {
		if err := tx.DeleteUserImageTypePreferences(ctx, userID); err != nil {
			return err
		}
		typeKeys := preferenceParams(types, func(key string, _ int) string {
			return key
		})
		inserted, err := tx.CreateUserImageTypePreferences(ctx, queries.CreateUserImageTypePreferencesParams{
			UserID: userID, TypeKeys: typeKeys,
		})
		if err != nil {
			return err
		}
		if inserted != int64(len(typeKeys)) {
			return fmt.Errorf("one or more image types are not seeded")
		}

		if groups == nil {
			return nil
		}

		if err := tx.DeleteUserImageTypeGroupPreferences(ctx, userID); err != nil {
			return err
		}
		params := preferenceParams(groups, func(key string, sortOrder int) queries.CreateUserImageTypeGroupPreferencesParams {
			return queries.CreateUserImageTypeGroupPreferencesParams{
				UserID: userID, GroupKey: key, SortOrder: sortOrder,
			}
		})
		_, err = tx.CreateUserImageTypeGroupPreferences(ctx, params)
		return err
	})
}

// preferenceParams numbers a preference list, dropping repeats
//
// Types and groups differ only in which table they land in and what their key
// is called
func preferenceParams[T ~string, P any](values []T, param func(key string, sortOrder int) P) []P {
	seen := make(map[T]struct{}, len(values))
	params := make([]P, 0, len(values))

	for _, value := range values {
		if _, duplicate := seen[value]; duplicate {
			continue
		}
		seen[value] = struct{}{}
		params = append(params, param(string(value), len(params)))
	}

	return params
}

// GroupPreferences returns a user's preferred group order, empty if none
func (s *ImageType) GroupPreferences(ctx context.Context, userID uuid.UUID) ([]models.ImageTypeGroupEnum, error) {
	keys, err := s.queries.GetUserImageTypeGroupPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	groups := make([]models.ImageTypeGroupEnum, len(keys))
	for i, key := range keys {
		groups[i] = models.ImageTypeGroupEnum(key)
	}
	return groups, nil
}

// facePreference is the Crop component given to an image carrying CROP_FACE.
// Seeded sort_order values start at zero, so this sorts below every real crop
// without needing a sentinel
const facePreference = -1

// ThumbnailRank ranks an image for use as a recognisable thumbnail: the
// instance tuple with the Crop component overridden so face crops lead their
// dimension
//
// The override must stay inside the Crop component rather than being prepended
// to the tuple: prepending puts it above Style, so a performer with a
// face-tattoo close-up and a well-framed bust portrait would get the tattoo in
// every search dropdown
//
// Naming CROP_FACE in code is only possible because the taxonomy is fixed
func (v *Ranking) ThumbnailRank(types []models.ImageTypeEnum) image.RankTuple {
	tuple := v.Rank(types)

	cropGroup, known := v.typeGroup[models.ImageTypeEnumCropFace]
	if !known {
		return tuple
	}

	position, ranked := v.groupPosition[cropGroup]
	if !ranked {
		return tuple
	}

	if slices.Contains(types, models.ImageTypeEnumCropFace) {
		tuple[position] = facePreference
	}

	return tuple
}

func (v *Ranking) ThumbnailRanksByImage(typesByImage map[uuid.UUID][]models.ImageTypeEnum) map[uuid.UUID]image.RankTuple {
	return v.ranksByImage(typesByImage, v.ThumbnailRank)
}
