// Package imagetype serves the image type vocabulary: a fixed set of labels,
// seeded by migration, that editors apply to images.
// Administrators can change the ordering and enable or disable entries.
package imagetype

import (
	"context"
	"fmt"
	"slices"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

// ImageType handles image type vocabulary operations
type ImageType struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

// NewImageType creates a new image type service
func NewImageType(queries *queries.Queries, withTxn queries.WithTxnFunc) *ImageType {
	return &ImageType{
		queries: queries,
		withTxn: withTxn,
	}
}

// Groups returns the vocabulary as groups in priority order, each carrying its
// types in priority order. A non-nil target keeps only types valid for that
// entity kind, and drops any group thereby left empty
//
// Disabled entries are omitted unless includeDisabled is true.
func (s *ImageType) Groups(ctx context.Context, target *models.ImageTypeScopeEnum, includeDisabled bool) ([]models.ImageTypeGroup, error) {
	vocabulary, err := cachedVocabulary(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	return vocabulary.filteredGroups(target, includeDisabled), nil
}

func (v *vocabulary) filteredGroups(target *models.ImageTypeScopeEnum, includeDisabled bool) []models.ImageTypeGroup {
	groups := make([]models.ImageTypeGroup, 0, len(v.groups))
	for _, group := range v.groups {
		if !includeDisabled && !group.Enabled {
			continue
		}
		types := make([]models.ImageType, 0, len(group.Types))
		for _, imageType := range group.Types {
			if target != nil && imageType.EntityType != *target {
				continue
			}
			if !includeDisabled && !imageType.Enabled {
				continue
			}
			imageType.ConflictsWith = slices.Clone(imageType.ConflictsWith)
			if imageType.Description != nil {
				imageType.Description = new(*imageType.Description)
			}
			types = append(types, imageType)
		}
		if len(types) == 0 {
			continue
		}
		group.Types = types
		if group.Description != nil {
			group.Description = new(*group.Description)
		}
		groups = append(groups, group)
	}
	return groups
}

// SetImageAssignments replaces one image's type assignments wholesale. Takes
// tx directly rather than opening its own transaction, so a caller can fold
// this into a larger transaction that also writes the image's other columns.
func SetImageAssignments(ctx context.Context, tx *queries.Queries, imageID uuid.UUID, types []models.ImageTypeEnum) error {
	if err := tx.DeleteImageTypeAssignments(ctx, imageID); err != nil {
		return err
	}

	if len(types) == 0 {
		return nil
	}

	keys := make([]string, len(types))
	for i, t := range types {
		keys[i] = string(t)
	}

	inserted, err := tx.CreateImageTypeAssignments(ctx, queries.CreateImageTypeAssignmentsParams{
		ImageID: imageID, TypeKeys: keys,
	})
	if err != nil {
		return err
	}
	if inserted != int64(len(keys)) {
		return fmt.Errorf("one or more image types are not seeded")
	}
	return nil
}

// SetAssignments replaces one image's type assignments wholesale, bypassing
// business validation (combination rules, enabled/grandfathering, role). For
// seeding fixtures and other trusted callers that already know the result is
// intended; imageUpdate is the validated path real clients go through
func (s *ImageType) SetAssignments(ctx context.Context, imageID uuid.UUID, types []models.ImageTypeEnum) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return SetImageAssignments(ctx, tx, imageID, types)
	})
}

// LoadAssignmentsByImageIds returns each image's type assignments, in
// vocabulary order, for the dataloader. Serves both Image.types and the
// gallery ranking used for Performer.images
func (s *ImageType) LoadAssignmentsByImageIds(ctx context.Context, ids []uuid.UUID) ([][]models.ImageTypeAssignment, []error) {
	rows, err := s.queries.FindImageTypesByImageIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	byImage := make(map[uuid.UUID][]models.ImageTypeAssignment)
	for _, row := range rows {
		byImage[row.ImageID] = append(byImage[row.ImageID], models.ImageTypeAssignment{
			ImageID: row.ImageID,
			Type:    models.ImageTypeEnum(row.TypeKey),
		})
	}

	result := make([][]models.ImageTypeAssignment, len(ids))
	for i, id := range ids {
		result[i] = byImage[id]
	}
	return result, nil
}
