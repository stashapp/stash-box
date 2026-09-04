// Package imagetype serves the image type vocabulary: a fixed set of labels,
// seeded by migration, that editors apply to an image's presence on an entity.
// Only sort_order is writable at runtime.
package imagetype

import (
	"context"
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
// Disabled entries are dropped unless includeDisabled, which only the admin
// screen passes: everywhere else asking for the vocabulary means asking what
// may be used, and a labeller offered a switched-off type makes no sense
func (s *ImageType) Groups(ctx context.Context, target *models.ImageTypeScopeEnum, includeDisabled bool) ([]models.ImageTypeGroup, error) {
	dbGroups, err := s.queries.GetAllImageTypeGroups(ctx)
	if err != nil {
		return nil, err
	}

	var dbTypes []queries.ImageType
	if target != nil {
		dbTypes, err = s.queries.GetImageTypesByTarget(ctx, string(*target))
	} else {
		dbTypes, err = s.queries.GetAllImageTypes(ctx)
	}
	if err != nil {
		return nil, err
	}

	// Seeded one way round, served both, so a client need not know which side
	// of a pair it is holding
	dbConflicts, err := s.queries.GetAllImageTypeConflicts(ctx)
	if err != nil {
		return nil, err
	}

	conflictsFor := make(map[string][]models.ImageTypeEnum, len(dbConflicts)*2)
	for _, dbConflict := range dbConflicts {
		conflictsFor[dbConflict.TypeKey] = append(
			conflictsFor[dbConflict.TypeKey], models.ImageTypeEnum(dbConflict.ConflictsWithKey))
		conflictsFor[dbConflict.ConflictsWithKey] = append(
			conflictsFor[dbConflict.ConflictsWithKey], models.ImageTypeEnum(dbConflict.TypeKey))
	}

	typesByGroup := make(map[string][]models.ImageType, len(dbGroups))
	for _, dbType := range dbTypes {
		if !includeDisabled && !dbType.Enabled {
			continue
		}
		typesByGroup[dbType.GroupKey] = append(
			typesByGroup[dbType.GroupKey], typeToModel(dbType, conflictsFor[dbType.Key]))
	}

	groups := make([]models.ImageTypeGroup, 0, len(dbGroups))
	for _, dbGroup := range dbGroups {
		if !includeDisabled && !dbGroup.Enabled {
			continue
		}

		types := typesByGroup[dbGroup.Key]

		// A group with no type valid for the target would render as an empty
		// section in the entity form, so omit it rather than return it bare.
		// A group whose every type is switched off is the same case
		if len(types) == 0 {
			continue
		}

		groups = append(groups, models.ImageTypeGroup{
			Key:         models.ImageTypeGroupEnum(dbGroup.Key),
			Name:        dbGroup.Name,
			Description: dbGroup.Description,
			SortOrder:   dbGroup.SortOrder,
			Exclusive:   dbGroup.Exclusive,
			Enabled:     dbGroup.Enabled,
			Types:       types,
		})
	}

	return groups, nil
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

	params := make([]queries.CreateImageTypeAssignmentsParams, len(types))
	for i, t := range types {
		params[i] = queries.CreateImageTypeAssignmentsParams{
			ImageID: imageID,
			TypeKey: string(t),
		}
	}

	_, err := tx.CreateImageTypeAssignments(ctx, params)
	return err
}

// SetAssignments replaces one image's type assignments wholesale, bypassing
// business validation (combination rules, enabled/grandfathering, role). For
// seeding fixtures and other trusted callers that already know the result is
// intended; imageUpdate is the validated path real clients go through.
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

func typeToModel(dbType queries.ImageType, conflictsWith []models.ImageTypeEnum) models.ImageType {
	validTypes := make([]models.ImageTypeScopeEnum, len(dbType.ValidTypes))
	for i, validType := range dbType.ValidTypes {
		validTypes[i] = models.ImageTypeScopeEnum(validType)
	}

	// Non-null in the schema, so an unconflicted type gets an empty list
	// rather than a null a client would have to guard
	if conflictsWith == nil {
		conflictsWith = []models.ImageTypeEnum{}
	}
	slices.Sort(conflictsWith)

	return models.ImageType{
		Key:           models.ImageTypeEnum(dbType.Key),
		Name:          dbType.Name,
		Description:   dbType.Description,
		SortOrder:     dbType.SortOrder,
		ValidTypes:    validTypes,
		Enabled:       dbType.Enabled,
		ConflictsWith: conflictsWith,
	}
}
