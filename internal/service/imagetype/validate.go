package imagetype

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// ValidateImageAssignment validates labels and date against the instance vocabulary.
// assigned contains the image's existing labels.
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

		// Existing labels may be retained even after their types are disabled.
		if _, had := assigned[imageType]; !vocab.enabled[key] && !had {
			return fmt.Errorf("image type %s is not enabled on this instance", imageType)
		}
	}

	return vocab.validateCombination(imageID, types)
}

func (v rules) validateCombination(imageID uuid.UUID, types []models.ImageTypeEnum) error {
	seenTypes := make(map[models.ImageTypeEnum]struct{}, len(types))
	typeInGroup := make(map[string]models.ImageTypeEnum, len(types))

	for _, imageType := range types {
		if _, duplicate := seenTypes[imageType]; duplicate {
			return fmt.Errorf("image %s lists %s more than once", imageID, imageType)
		}
		seenTypes[imageType] = struct{}{}

		groupKey := v.groupOf[string(imageType)]
		if other, used := typeInGroup[groupKey]; used && v.exclusive[groupKey] {
			return fmt.Errorf("image %s cannot be both %s and %s: %s allows at most one",
				imageID, other, imageType, groupKey)
		}
		typeInGroup[groupKey] = imageType
	}

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

// loadConflictPairs validates conflict references and stores each pair in a stable order.
// Array elements cannot have foreign keys.
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

// AssignedTypes contains an image's existing labels; nil means none.
type AssignedTypes map[models.ImageTypeEnum]struct{}

// ImageAssignedTypes loads an image's existing labels.
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

// conflictKey orders a pair so conflict checks work in either direction.
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

func validateImageDate(imageID uuid.UUID, date *string) error {
	if err := models.ValidateFuzzyString(date); err != nil {
		return fmt.Errorf("image %s has an invalid date %q: expected YYYY, YYYY-MM or YYYY-MM-DD",
			imageID, *date)
	}

	return nil
}
