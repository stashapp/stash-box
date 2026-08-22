package performer

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

func createAliases(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, aliases []string) error {
	var params []queries.CreatePerformerAliasesParams
	for _, alias := range aliases {
		params = append(params, queries.CreatePerformerAliasesParams{
			PerformerID: performerID,
			Alias:       alias,
		})
	}
	_, err := tx.CreatePerformerAliases(ctx, params)
	return err
}

func updateAliases(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, aliases []string) error {
	if err := tx.DeletePerformerAliases(ctx, performerID); err != nil {
		return err
	}
	return createAliases(ctx, tx, performerID, aliases)
}

func createTattoos(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, tattoos []models.BodyModification) error {
	var params []queries.CreatePerformerTattoosParams
	for _, tattoo := range tattoos {
		params = append(params, queries.CreatePerformerTattoosParams{
			PerformerID: performerID,
			Location:    &tattoo.Location,
			Description: tattoo.Description,
		})
	}
	_, err := tx.CreatePerformerTattoos(ctx, params)
	return err
}

func updateTattoos(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, tattoos []models.BodyModification) error {
	if err := tx.DeletePerformerTattoos(ctx, performerID); err != nil {
		return err
	}
	return createTattoos(ctx, tx, performerID, tattoos)
}

func createPiercings(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, piercings []models.BodyModification) error {
	var params []queries.CreatePerformerPiercingsParams
	for _, piercing := range piercings {
		params = append(params, queries.CreatePerformerPiercingsParams{
			PerformerID: performerID,
			Location:    &piercing.Location,
			Description: piercing.Description,
		})
	}
	_, err := tx.CreatePerformerPiercings(ctx, params)
	return err
}

func updatePiercings(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, piercings []models.BodyModification) error {
	if err := tx.DeletePerformerPiercings(ctx, performerID); err != nil {
		return err
	}
	return createPiercings(ctx, tx, performerID, piercings)
}

func createURLs(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, urls []models.URL) error {
	var params []queries.CreatePerformerURLsParams
	for _, url := range urls {
		params = append(params, queries.CreatePerformerURLsParams{
			PerformerID: performerID,
			Url:         url.URL,
			SiteID:      url.SiteID,
		})
	}
	_, err := tx.CreatePerformerURLs(ctx, params)
	return err
}

func updateURLs(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, urls []models.URL) error {
	if err := tx.DeletePerformerURLs(ctx, performerID); err != nil {
		return err
	}
	return createURLs(ctx, tx, performerID, urls)
}

func createImages(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, images []uuid.UUID, imageTypes []models.ImageAssignmentInput) error {
	return writeImages(ctx, tx, performerID, images, imageTypes, nil, nil)
}

// resolveDates works out each image's date after a write. Unlike labels, a
// date is single-valued, so an entry overrides rather than merges - including
// overriding with null to clear it. An image the submission does not touch
// keeps the date it had
func resolveDates(currentDates []queries.PerformerImage, imageTypes []models.ImageAssignmentInput) map[uuid.UUID]*string {
	dates := make(map[uuid.UUID]*string, len(currentDates))
	for _, row := range currentDates {
		dates[row.ImageID] = row.Date
	}

	for _, entry := range imageTypes {
		dates[entry.ImageID] = entry.Date
	}

	return dates
}

func updateImages(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, images []uuid.UUID, imageTypes []models.ImageAssignmentInput) error {
	// TODO Remove unused images

	// Read before the delete below, which cascades the assignments away with the
	// join rows through performer_image_types' composite foreign key. Preserving
	// them is active work, not the default
	current, err := tx.FindImageTypesByPerformerIds(ctx, []uuid.UUID{performerID})
	if err != nil {
		return err
	}

	// Same for date, a column on those rows
	currentDates, err := tx.FindImageDatesByPerformerIds(ctx, []uuid.UUID{performerID})
	if err != nil {
		return err
	}

	if err := tx.DeletePerformerImages(ctx, performerID); err != nil {
		return err
	}

	return writeImages(ctx, tx, performerID, images, imageTypes, current, currentDates)
}

func writeImages(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, images []uuid.UUID, imageTypes []models.ImageAssignmentInput, current []queries.PerformerImageType, currentDates []queries.PerformerImage) error {
	dates := resolveDates(currentDates, imageTypes)

	// A repeated id would violate performer_images' primary key. The insert
	// uses COPY, which admits no ON CONFLICT, so dedupe here instead
	seen := make(map[uuid.UUID]struct{}, len(images))
	unique := make([]uuid.UUID, 0, len(images))

	var imageParams []queries.CreatePerformerImagesParams
	for _, image := range images {
		if _, duplicate := seen[image]; duplicate {
			continue
		}
		seen[image] = struct{}{}
		unique = append(unique, image)

		imageParams = append(imageParams, queries.CreatePerformerImagesParams{
			PerformerID: performerID,
			ImageID:     image,
			Date:        dates[image],
		})
	}

	if _, err := tx.CreatePerformerImages(ctx, imageParams); err != nil {
		return err
	}

	// After the join rows, which the composite foreign key requires to exist
	assignments := resolveAssignments(current, imageTypes, unique)

	typeParams := make([]queries.CreatePerformerImageTypesParams, len(assignments))
	for i, assignment := range assignments {
		typeParams[i] = queries.CreatePerformerImageTypesParams{
			PerformerID: performerID,
			ImageID:     assignment.ImageID,
			TypeKey:     string(assignment.Type),
		}
	}

	_, err := tx.CreatePerformerImageTypes(ctx, typeParams)
	return err
}

// resolveAssignments works out which assignments should exist after a write.
// It implements the performerCreate/performerUpdate columns of the table on
// ImageAssignmentInput in graphql/schema/types/image_type.graphql; the edit
// path implements the same table in edit/performer.go and edit.sql, and
// nothing makes the three agree except that table.
//
// Assignments for images that did not survive are dropped either way: the
// composite foreign key would reject them
func resolveAssignments(current []queries.PerformerImageType, imageTypes []models.ImageAssignmentInput, images []uuid.UUID) []models.ImageTypeAssignment {
	if imageTypes != nil && len(imageTypes) == 0 {
		return nil
	}

	typesByImage := make(map[uuid.UUID][]models.ImageTypeEnum, len(images))
	for _, row := range current {
		typesByImage[row.ImageID] = append(typesByImage[row.ImageID], models.ImageTypeEnum(row.TypeKey))
	}

	for _, entry := range imageTypes {
		typesByImage[entry.ImageID] = entry.Types
	}

	// Walking images rather than the map is what drops an image that did not
	// survive: one gathered above but absent here is never emitted
	var assignments []models.ImageTypeAssignment
	for _, image := range images {
		for _, imageType := range typesByImage[image] {
			assignments = append(assignments, models.ImageTypeAssignment{
				ImageID: image,
				Type:    imageType,
			})
		}
	}

	return assignments
}
