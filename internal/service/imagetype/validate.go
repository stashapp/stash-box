package imagetype

import (
	"context"
	"fmt"
	"slices"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// ValidateAssignments checks the constraints that hold however assignments are
// written: through an edit, or straight through performerCreate/performerUpdate.
//
// entityImageIDs is the entity's resulting image set: input.ImageIds on the
// direct path, the edit's resolved images on the edit path. assigned is what
// those images already carry, and is empty when the entity is being created.
func ValidateAssignments(
	ctx context.Context,
	q *queries.Queries,
	target models.ImageTypeScopeEnum,
	assignments []models.ImageAssignmentInput,
	entityImageIDs []uuid.UUID,
	assigned AssignedTypes,
) error {
	if len(assignments) == 0 {
		return nil
	}

	// Checked before anything needing the vocabulary, so a date-only
	// submission does not pay for a lookup it has no use for
	for _, assignment := range assignments {
		if err := validateTakenDate(assignment.ImageID, assignment.Date); err != nil {
			return err
		}
	}

	vocab, err := loadRules(ctx, q)
	if err != nil {
		return err
	}

	onEntity := make(map[uuid.UUID]struct{}, len(entityImageIDs))
	for _, imageID := range entityImageIDs {
		onEntity[imageID] = struct{}{}
	}

	for _, assignment := range assignments {
		if _, ok := onEntity[assignment.ImageID]; !ok {
			return fmt.Errorf("image %s is not one of this entity's images", assignment.ImageID)
		}

		for _, imageType := range assignment.Types {
			key := string(imageType)

			if _, known := vocab.groupOf[key]; !known {
				return fmt.Errorf("image type %s is not seeded", imageType)
			}

			if !slices.Contains(vocab.validTargets[key], string(target)) {
				return fmt.Errorf("image type %s cannot be applied to a %s", imageType, target)
			}

			// Only newly-added types have to be enabled. Every save restates
			// the labels an image already has, so rejecting those outright
			// would make switching a type off strand every entity carrying it:
			// unsaveable, with no way to drop the label except to turn the type
			// back on. Switching a group off is meant to be reversible.
			if !vocab.enabled[key] && !assigned.has(assignment.ImageID, imageType) {
				return fmt.Errorf("image type %s is not enabled on this instance", imageType)
			}
		}
	}

	return vocab.validateCombinations(assignments)
}

// ValidateCombinations checks the constraints that merging can break, against
// an assignment set that no single submission ever stated
//
// Every edit is resolved against current state when applied, so two that were
// each valid when written can contradict each other by landing one after the
// other: E1 adding VIEW_FRONT and E2 adding VIEW_SIDE both validate against a
// clean image, and POSE allows one. Nothing in the schema catches it -
// performer_image_types has no per-group exclusion, and a partial unique index
// could not express conflicts_with anyway
//
// Only the combination rules are checked; the rest was settled when the edit
// was written and merging cannot break it
func ValidateCombinations(ctx context.Context, q *queries.Queries, assignments []models.ImageAssignmentInput) error {
	if len(assignments) == 0 {
		return nil
	}

	vocab, err := loadRules(ctx, q)
	if err != nil {
		return err
	}

	return vocab.validateCombinations(assignments)
}

func (v rules) validateCombinations(assignments []models.ImageAssignmentInput) error {
	seenImages := make(map[uuid.UUID]struct{}, len(assignments))

	for _, assignment := range assignments {
		if _, duplicate := seenImages[assignment.ImageID]; duplicate {
			return fmt.Errorf("image %s appears more than once in image_types", assignment.ImageID)
		}
		seenImages[assignment.ImageID] = struct{}{}

		seenTypes := make(map[models.ImageTypeEnum]struct{}, len(assignment.Types))
		typeInGroup := make(map[string]models.ImageTypeEnum, len(assignment.Types))

		for _, imageType := range assignment.Types {
			if _, duplicate := seenTypes[imageType]; duplicate {
				return fmt.Errorf("image %s lists %s more than once", assignment.ImageID, imageType)
			}
			seenTypes[imageType] = struct{}{}

			// Exclusivity prevents contradiction: an image cannot be both
			// CROP_FACE and CROP_WIDE. It is a property of the group, and
			// unrelated to whether many images may share a type
			groupKey := v.groupOf[string(imageType)]
			if other, used := typeInGroup[groupKey]; used && v.exclusive[groupKey] {
				return fmt.Errorf("image %s cannot be both %s and %s: %s allows at most one",
					assignment.ImageID, other, imageType, groupKey)
			}
			typeInGroup[groupKey] = imageType
		}

		// Cross-group impossibilities, once the image's whole set is known.
		// Exclusivity above is about one group contradicting itself; this is
		// one group contradicting another - a face crop cannot be topless
		// because the chest is not in the frame
		if err := conflictBetween(assignment.ImageID, assignment.Types, v.conflicts); err != nil {
			return err
		}
	}

	return nil
}

// rules is the seeded reference data both checks read, loaded once. Distinct from
// Vocabulary in rank.go, which leaves disabled entries out entirely: ranking must
// ignore them, validation has to be able to reject them
type rules struct {
	groupOf      map[string]string
	validTargets map[string][]string
	enabled      map[string]bool
	exclusive    map[string]bool
	conflicts    map[[2]models.ImageTypeEnum]struct{}
}

func loadRules(ctx context.Context, q *queries.Queries) (rules, error) {
	dbGroups, err := q.GetAllImageTypeGroups(ctx)
	if err != nil {
		return rules{}, err
	}

	v := rules{
		exclusive: make(map[string]bool, len(dbGroups)),
	}

	enabledGroups := make(map[string]bool, len(dbGroups))
	for _, dbGroup := range dbGroups {
		v.exclusive[dbGroup.Key] = dbGroup.Exclusive
		enabledGroups[dbGroup.Key] = dbGroup.Enabled
	}

	dbTypes, err := q.GetAllImageTypes(ctx)
	if err != nil {
		return rules{}, err
	}

	v.groupOf = make(map[string]string, len(dbTypes))
	v.validTargets = make(map[string][]string, len(dbTypes))
	v.enabled = make(map[string]bool, len(dbTypes))
	for _, dbType := range dbTypes {
		v.groupOf[dbType.Key] = dbType.GroupKey
		v.validTargets[dbType.Key] = dbType.ValidTypes
		// A group being off disables its types by implication, so both are
		// folded into one lookup rather than checked separately
		v.enabled[dbType.Key] = dbType.Enabled && enabledGroups[dbType.GroupKey]
	}

	dbConflicts, err := q.GetAllImageTypeConflicts(ctx)
	if err != nil {
		return rules{}, err
	}

	v.conflicts = make(map[[2]models.ImageTypeEnum]struct{}, len(dbConflicts))
	for _, dbConflict := range dbConflicts {
		v.conflicts[conflictKey(
			models.ImageTypeEnum(dbConflict.TypeKey),
			models.ImageTypeEnum(dbConflict.ConflictsWithKey),
		)] = struct{}{}
	}

	return v, nil
}

// AssignedTypes is the set of types an entity's images already carry, keyed by
// image. A nil map is the create case and grandfathers nothing
type AssignedTypes map[uuid.UUID]map[models.ImageTypeEnum]struct{}

func (a AssignedTypes) has(imageID uuid.UUID, imageType models.ImageTypeEnum) bool {
	_, ok := a[imageID][imageType]
	return ok
}

// PerformerAssignedTypes reads what a performer's images already carry. The
// lookup lives at the call site rather than inside ValidateAssignments because
// the assignment tables are per-target and the validator is not
func PerformerAssignedTypes(ctx context.Context, q *queries.Queries, performerID uuid.UUID) (AssignedTypes, error) {
	rows, err := q.FindImageTypesByPerformerIds(ctx, []uuid.UUID{performerID})
	if err != nil {
		return nil, err
	}

	assigned := make(AssignedTypes)
	for _, row := range rows {
		if assigned[row.ImageID] == nil {
			assigned[row.ImageID] = make(map[models.ImageTypeEnum]struct{})
		}
		assigned[row.ImageID][models.ImageTypeEnum(row.TypeKey)] = struct{}{}
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

// validateTakenDate accepts the three partial ISO 8601 precisions the schema
// already uses for uncertain dates, checked here because the column is text:
// nothing downstream would reject 2019-13
func validateTakenDate(imageID uuid.UUID, date *string) error {
	if err := models.ValidateFuzzyString(date); err != nil {
		return fmt.Errorf("image %s has an invalid date %q: expected YYYY, YYYY-MM or YYYY-MM-DD",
			imageID, *date)
	}

	return nil
}
