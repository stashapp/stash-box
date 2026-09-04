package imagetype

import (
	"context"
	"fmt"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// UpdateOrder rewrites sort_order on both tables from list position and
// returns the reordered vocabulary. This is the whole admin write surface:
// the taxonomy itself is fixed, and only its ordering can be customized.
func (s *ImageType) UpdateOrder(ctx context.Context, input models.ImageTypeOrderInput) ([]models.ImageTypeGroup, error) {
	if err := validateComplete("groups", input.Groups, models.AllImageTypeGroupEnum); err != nil {
		return nil, err
	}
	if err := validateComplete("types", input.Types, models.AllImageTypeEnum); err != nil {
		return nil, err
	}

	err := s.withTxn(func(tx *queries.Queries) error {
		// Which group a type belongs to is read rather than derived from the
		// key prefix: the prefix rule is asserted by a test, not by the
		// schema, so trusting it here would let a seeding mistake renumber
		// the wrong group
		dbTypes, err := tx.GetAllImageTypes(ctx)
		if err != nil {
			return err
		}

		groupOfType := make(map[string]string, len(dbTypes))
		for _, dbType := range dbTypes {
			groupOfType[dbType.Key] = dbType.GroupKey
		}

		for i, key := range input.Groups {
			if err := tx.UpdateImageTypeGroupSortOrder(ctx, queries.UpdateImageTypeGroupSortOrderParams{
				Key:       string(key),
				SortOrder: i,
			}); err != nil {
				return err
			}
		}

		// Only position within a group counts, so each group's types are
		// numbered from zero in the order they appear. The submitted list may
		// therefore interleave groups freely
		nextInGroup := make(map[string]int, len(input.Groups))
		for _, key := range input.Types {
			groupKey, ok := groupOfType[string(key)]
			if !ok {
				return fmt.Errorf("image type %s is not seeded", key)
			}

			if err := tx.UpdateImageTypeSortOrder(ctx, queries.UpdateImageTypeSortOrderParams{
				Key:       string(key),
				SortOrder: nextInGroup[groupKey],
			}); err != nil {
				return err
			}
			nextInGroup[groupKey]++
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.Groups(ctx, nil, true)
}

// validateComplete rejects anything short of a total ordering. Every submitted
// value being known, none repeated, and the count matching together mean the
// submitted list is exactly the full set. No need to diff here.
func validateComplete[T comparable](field string, submitted []T, all []T) error {
	known := make(map[T]struct{}, len(all))
	for _, value := range all {
		known[value] = struct{}{}
	}

	seen := make(map[T]struct{}, len(submitted))
	for _, value := range submitted {
		if _, ok := known[value]; !ok {
			return fmt.Errorf("%s contains unknown value %v", field, value)
		}
		if _, duplicate := seen[value]; duplicate {
			return fmt.Errorf("%s lists %v more than once", field, value)
		}
		seen[value] = struct{}{}
	}

	if len(submitted) != len(all) {
		return fmt.Errorf("%s must list all %d values in order, got %d", field, len(all), len(submitted))
	}

	return nil
}

// SetEnabled records which parts of the vocabulary this instance uses
//
// Takes the complete disabled set rather than a per-key toggle, so the write
// is idempotent and a client cannot half-apply one. Nothing is deleted: rows
// stay, assignments stay, and the foreign keys from performer_image_types stay
// valid, so switching a group back on restores every label made while it was
// in use
func (s *ImageType) SetEnabled(ctx context.Context, input models.ImageTypeEnabledInput) ([]models.ImageTypeGroup, error) {
	groups := make([]string, len(input.DisabledGroups))
	for i, group := range input.DisabledGroups {
		groups[i] = string(group)
	}

	types := make([]string, len(input.DisabledTypes))
	for i, imageType := range input.DisabledTypes {
		types[i] = string(imageType)
	}

	err := s.withTxn(func(tx *queries.Queries) error {
		if err := tx.SetImageTypeGroupsEnabled(ctx, groups); err != nil {
			return err
		}
		return tx.SetImageTypesEnabled(ctx, types)
	})
	if err != nil {
		return nil, err
	}

	// Disabled entries included: this is the admin screen's own read-back, and
	// it has to keep showing what it just switched off so that it can be switched
	// back on
	return s.Groups(ctx, nil, true)
}
