package imagetype

import (
	"context"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/image"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// Vocabulary is the ordering half of the image type vocabulary: which dimension
// each type belongs to, and how the instance ranks them. Read once per request,
// since every performer in a result ranks against the same one
type Vocabulary struct {
	// Tuple position of each group, in group priority order
	groupPosition map[string]int
	groupCount    int
	// Priority of each type within its group
	typePosition map[models.ImageTypeEnum]int
	typeGroup    map[models.ImageTypeEnum]string
	// The unadjusted instance ordering, when this one carries a user's
	// preference: is nil when this is already the instance ordering
	instance *Vocabulary
}

func (v *Vocabulary) Instance() *Vocabulary {
	if v.instance != nil {
		return v.instance
	}
	return v
}

// VocabularyFor reads the ordering as one user sees it: the instance ordering
// with that user's preference applied. Callers pass the viewer, which is how
// scraping gets its owner's ordering without changing its query
func (s *ImageType) VocabularyFor(ctx context.Context, userID uuid.UUID) (*Vocabulary, error) {
	vocabulary, err := loadVocabulary(ctx, s.queries)
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
		return vocabulary, nil
	}

	// The two compose in either order; groups go first as the stronger one
	if len(preferredGroups) > 0 {
		vocabulary = vocabulary.withGroupPreference(preferredGroups)
	}

	if len(preferred) > 0 {
		types := make([]models.ImageTypeEnum, len(preferred))
		for i, key := range preferred {
			types[i] = models.ImageTypeEnum(key)
		}
		vocabulary = vocabulary.withPreference(types)
	}

	return vocabulary, nil
}

// withPreference reorders types within each group, leaving the group order to
// whatever the caller already decided. Types the user did not list trail the
// ones they did, in instance order, so a partial preference is well defined
func (v *Vocabulary) withPreference(preferred []models.ImageTypeEnum) *Vocabulary {
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

	adjusted := &Vocabulary{
		groupPosition: v.groupPosition,
		groupCount:    v.groupCount,
		typePosition:  make(map[models.ImageTypeEnum]int, len(v.typePosition)),
		typeGroup:     v.typeGroup,
		// Instance() must stay unadjusted however many preferences are layered on
		instance: v.Instance(),
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
// dimension. Thumbnails are unaffected bacause they rank against Instance()
// which keeps them the same for every viewer
func (v *Vocabulary) withGroupPreference(preferred []string) *Vocabulary {
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

	adjusted := &Vocabulary{
		groupPosition: make(map[string]int, len(v.groupPosition)),
		groupCount:    v.groupCount,
		typePosition:  v.typePosition,
		typeGroup:     v.typeGroup,
		// Points at the instance ordering, not an already adjusted vocabulary
		instance: v.Instance(),
	}

	for position, groupKey := range append(ordered, remaining...) {
		adjusted.groupPosition[groupKey] = position
	}

	return adjusted
}

func loadVocabulary(ctx context.Context, q *queries.Queries) (*Vocabulary, error) {
	dbGroups, err := q.GetAllImageTypeGroups(ctx)
	if err != nil {
		return nil, err
	}

	dbTypes, err := q.GetAllImageTypes(ctx)
	if err != nil {
		return nil, err
	}

	// Disabled entries are left out entirely rather than ranked last: Rank skips
	// whatever is missing from typeGroup, so no branch is needed in the
	// comparison. Assignments made while a type was enabled stay in the database
	// and stop counting, which makes re-enabling lossless
	enabledGroups := make(map[string]bool, len(dbGroups))
	vocabulary := &Vocabulary{
		groupPosition: make(map[string]int, len(dbGroups)),
		typePosition:  make(map[models.ImageTypeEnum]int, len(dbTypes)),
		typeGroup:     make(map[models.ImageTypeEnum]string, len(dbTypes)),
	}

	// GetAllImageTypeGroups orders by sort_order, so position is priority.
	// Assigned over enabled groups only, so a tuple has no gap where a disabled
	// dimension used to be
	for _, dbGroup := range dbGroups {
		enabledGroups[dbGroup.Key] = dbGroup.Enabled
		if !dbGroup.Enabled {
			continue
		}
		vocabulary.groupPosition[dbGroup.Key] = vocabulary.groupCount
		vocabulary.groupCount++
	}

	for _, dbType := range dbTypes {
		if !dbType.Enabled || !enabledGroups[dbType.GroupKey] {
			continue
		}
		key := models.ImageTypeEnum(dbType.Key)
		vocabulary.typePosition[key] = dbType.SortOrder
		vocabulary.typeGroup[key] = dbType.GroupKey
	}

	return vocabulary, nil
}

// Rank builds one image's tuple: for each group, the position of the image's
// best type in it, or Unranked
//
// "Best" rather than "only" because exclusivity is enforced by the validators
// and the seed data, not by the schema: an image that has ended up with two
// values from one group sorts by the better of them rather than by whichever
// the query returned last
func (v *Vocabulary) Rank(types []models.ImageTypeEnum) image.RankTuple {
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

// RanksByImage builds the tuple for every image an entity carries. Images with
// no assignments are absent from the map, which OrderByType reads as the
// all-Unranked tuple
func (v *Vocabulary) RanksByImage(assignments []models.ImageTypeAssignment) map[uuid.UUID]image.RankTuple {
	return v.ranksByImage(assignments, v.Rank)
}

// ranksByImage regroups flat assignments by image and ranks each one. The two
// callers differ only in which ranking they ask for
func (v *Vocabulary) ranksByImage(
	assignments []models.ImageTypeAssignment,
	rank func([]models.ImageTypeEnum) image.RankTuple,
) map[uuid.UUID]image.RankTuple {
	typesByImage := make(map[uuid.UUID][]models.ImageTypeEnum)
	for _, assignment := range assignments {
		typesByImage[assignment.ImageID] = append(typesByImage[assignment.ImageID], assignment.Type)
	}

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
		typeParams := preferenceParams(types, func(key string, sortOrder int) queries.CreateUserImageTypePreferencesParams {
			return queries.CreateUserImageTypePreferencesParams{
				UserID: userID, TypeKey: key, SortOrder: sortOrder,
			}
		})
		if _, err := tx.CreateUserImageTypePreferences(ctx, typeParams); err != nil {
			return err
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
		_, err := tx.CreateUserImageTypeGroupPreferences(ctx, params)
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
// to the tuple: prepending puts it above Shot type, so a performer with a
// face-tattoo close-up and a well-framed bust portrait would get the tattoo in
// every search dropdown
//
// Naming CROP_FACE in code is only possible because the taxonomy is fixed
func (v *Vocabulary) ThumbnailRank(types []models.ImageTypeEnum) image.RankTuple {
	tuple := v.Rank(types)

	cropGroup, known := v.typeGroup[models.ImageTypeEnumCropFace]
	if !known {
		return tuple
	}

	position, ranked := v.groupPosition[cropGroup]
	if !ranked {
		return tuple
	}

	for _, imageType := range types {
		if imageType == models.ImageTypeEnumCropFace {
			tuple[position] = facePreference
			break
		}
	}

	return tuple
}

func (v *Vocabulary) ThumbnailRanksByImage(assignments []models.ImageTypeAssignment) map[uuid.UUID]image.RankTuple {
	return v.ranksByImage(assignments, v.ThumbnailRank)
}
