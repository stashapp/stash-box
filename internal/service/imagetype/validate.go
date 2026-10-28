package imagetype

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// ValidateImageAssignment checks the constraints that hold whenever one
// image's labels and date are set via imageCreate or imageUpdate
//
// There is deliberately no check here against the image's entity attachment
// (performer/scene/studio): only the PERFORMER scope is seeded today and
// nothing exposes a way to trigger a mismatch, so that check is deferred
// until scene/studio taxonomies ship. assigned is what the image already
// carries, empty when it is being labelled for the first time
func ValidateImageAssignment(
	ctx context.Context,
	q *queries.Queries,
	imageID uuid.UUID,
	types []models.ImageTypeEnum,
	date *string,
	assigned AssignedTypes,
) error {
	if err := validateImageDate(imageID, date); err != nil {
		return err
	}

	if len(types) == 0 {
		return nil
	}

	vocabulary, err := cachedVocabulary(ctx, q)
	if err != nil {
		return err
	}

	vocab := vocabulary.rules
	for _, imageType := range types {
		key := string(imageType)

		if _, known := vocab.groupOf[key]; !known {
			return fmt.Errorf("image type %s is not seeded", imageType)
		}

		// Only newly-added types have to be enabled. Every save restates
		// the labels an image already has, so rejecting those outright
		// would make switching a type off strand every image carrying it:
		// unsaveable, with no way to drop the label except to turn the type
		// back on. Switching a group off is meant to be reversible.
		if _, had := assigned[imageType]; !vocab.enabled[key] && !had {
			return fmt.Errorf("image type %s is not enabled on this instance", imageType)
		}
	}

	return vocab.validateCombination(imageID, types)
}

// validateCombination checks one image's proposed label set
// against the vocabulary's combination rules
func (v rules) validateCombination(imageID uuid.UUID, types []models.ImageTypeEnum) error {
	seenTypes := make(map[models.ImageTypeEnum]struct{}, len(types))
	typeInGroup := make(map[string]models.ImageTypeEnum, len(types))

	for _, imageType := range types {
		if _, duplicate := seenTypes[imageType]; duplicate {
			return fmt.Errorf("image %s lists %s more than once", imageID, imageType)
		}
		seenTypes[imageType] = struct{}{}

		// Exclusivity prevents contradiction: an image cannot be both
		// CROP_FACE and CROP_WIDE. It is a property of the group, and
		// unrelated to whether many images may share a type
		groupKey := v.groupOf[string(imageType)]
		if other, used := typeInGroup[groupKey]; used && v.exclusive[groupKey] {
			return fmt.Errorf("image %s cannot be both %s and %s: %s allows at most one",
				imageID, other, imageType, groupKey)
		}
		typeInGroup[groupKey] = imageType
	}

	// Cross-group impossibilities, once the image's whole set is known.
	// Exclusivity above is about one group contradicting itself; this is
	// one group contradicting another: a face crop cannot be topless
	// because the chest is not in the frame
	return conflictBetween(imageID, types, v.conflicts)
}

// rules keeps disabled entries so validation can reject new assignments while
// allowing labels already present on an image.
type rules struct {
	groupOf   map[string]string
	enabled   map[string]bool
	exclusive map[string]bool
	conflicts map[[2]models.ImageTypeEnum]struct{}
}

// loadConflictPairs canonicalizes one-sided declarations for use in either
// direction. Validate keys here because array elements cannot have foreign keys.
func loadConflictPairs(types []queries.ImageType) (map[[2]models.ImageTypeEnum]struct{}, error) {
	known := make(map[string]struct{}, len(types))
	for _, imageType := range types {
		known[imageType.Key] = struct{}{}
	}
	pairs := make(map[[2]models.ImageTypeEnum]struct{})
	for _, imageType := range types {
		for _, other := range imageType.Conflicts {
			if _, ok := known[other]; !ok {
				return nil, fmt.Errorf("image type %s conflicts with unknown type %s", imageType.Key, other)
			}
			if other == imageType.Key {
				return nil, fmt.Errorf("image type %s conflicts with itself", other)
			}
			pairs[conflictKey(models.ImageTypeEnum(imageType.Key), models.ImageTypeEnum(other))] = struct{}{}
		}
	}
	return pairs, nil
}

// AssignedTypes is the set of types one image already carries. Nil is the
// create case and grandfathers nothing
type AssignedTypes map[models.ImageTypeEnum]struct{}

// ImageAssignedTypes reads what an image already carries, for grandfathering
// a type a save restates that has since been disabled.
func ImageAssignedTypes(ctx context.Context, q *queries.Queries, imageID uuid.UUID) (AssignedTypes, error) {
	rows, err := q.FindImageTypesByImageIds(ctx, []uuid.UUID{imageID})
	if err != nil {
		return nil, err
	}

	assigned := make(AssignedTypes, len(rows))
	for _, row := range rows {
		assigned[models.ImageTypeEnum(row.TypeKey)] = struct{}{}
	}

	return assigned, nil
}

// conflictKey pairs two types in a stable order, so a pair seeded one way
// round is found however the caller happens to list them
func conflictKey(a, b models.ImageTypeEnum) [2]models.ImageTypeEnum {
	if a > b {
		return [2]models.ImageTypeEnum{b, a}
	}
	return [2]models.ImageTypeEnum{a, b}
}

func conflictBetween(imageID uuid.UUID, types []models.ImageTypeEnum, conflicts map[[2]models.ImageTypeEnum]struct{}) error {
	for i, first := range types {
		for _, second := range types[i+1:] {
			if _, forbidden := conflicts[conflictKey(first, second)]; forbidden {
				return fmt.Errorf("image %s cannot be both %s and %s", imageID, first, second)
			}
		}
	}
	return nil
}

// validateImageDate accepts the three partial ISO 8601 precisions the schema
// already uses for uncertain dates, checked here because the column is text:
// nothing downstream would reject 2019-13
func validateImageDate(imageID uuid.UUID, date *string) error {
	if err := models.ValidateFuzzyString(date); err != nil {
		return fmt.Errorf("image %s has an invalid date %q: expected YYYY, YYYY-MM or YYYY-MM-DD",
			imageID, *date)
	}

	return nil
}
