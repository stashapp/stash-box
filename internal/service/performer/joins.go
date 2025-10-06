package performer

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/models"
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

func createImages(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, images []uuid.UUID) error {
	var params []queries.CreatePerformerImagesParams
	for _, image := range images {
		params = append(params, queries.CreatePerformerImagesParams{
			PerformerID: performerID,
			ImageID:     image,
		})
	}

	_, err := tx.CreatePerformerImages(ctx, params)
	return err
}

func updateImages(ctx context.Context, tx *queries.Queries, performerID uuid.UUID, images []uuid.UUID) error {
	// TODO Remove unused images
	if err := tx.DeletePerformerImages(ctx, performerID); err != nil {
		return err
	}
	return createImages(ctx, tx, performerID, images)
}
