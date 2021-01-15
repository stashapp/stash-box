package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/image"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) PerformerCreate(ctx context.Context, input models.PerformerCreateInput) (*models.Performer, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	currentTime := time.Now()
	newPerformer := models.Performer{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	var performer *models.Performer
	err = database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewPerformerQueryBuilder(txn.GetTx())
		jqb := models.NewJoinsQueryBuilder(txn.GetTx())

		err = newPerformer.CopyFromCreateInput(input)
		if err != nil {
			return err
		}

		performer, err = qb.Create(newPerformer)
		if err != nil {
			return err
		}

		// Save the aliases
		performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
		if err := qb.CreateAliases(performerAliases); err != nil {
			return err
		}

		// Save the URLs
		performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
		if err := qb.CreateUrls(performerUrls); err != nil {
			return err
		}

		// Save the Tattoos
		performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
		if err := qb.CreateTattoos(performerTattoos); err != nil {
			return err
		}

		// Save the Piercings
		performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
		if err := qb.CreatePiercings(performerPiercings); err != nil {
			return err
		}

		// Save the images
		performerImages := models.CreatePerformerImages(performer.ID, input.ImageIds)

		if err := jqb.CreatePerformersImages(performerImages); err != nil {
			return err
		}

		return nil
	})

	// Commit
	if err != nil {
		return nil, err
	}

	return performer, nil
}

func (r *mutationResolver) PerformerUpdate(ctx context.Context, input models.PerformerUpdateInput) (*models.Performer, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var performer *models.Performer
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewPerformerQueryBuilder(txn.GetTx())
		jqb := models.NewJoinsQueryBuilder(txn.GetTx())
		iqb := models.NewImageQueryBuilder(txn.GetTx())

		// get the existing performer and modify it
		performerID, _ := uuid.FromString(input.ID)
		updatedPerformer, err := qb.Find(performerID)

		if err != nil {
			return err
		}

		if updatedPerformer == nil {
			return models.NotFoundError(performerID)
		}

		updatedPerformer.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate performer from the input
		if err = updatedPerformer.CopyFromUpdateInput(input); err != nil {
			return err
		}

		performer, err = qb.Update(*updatedPerformer)
		if err != nil {
			return err
		}

		// Save the aliases
		performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
		if err := qb.UpdateAliases(performer.ID, performerAliases); err != nil {
			return err
		}

		// Save the URLs
		performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
		if err := qb.UpdateUrls(performer.ID, performerUrls); err != nil {
			return err
		}

		// Save the Tattoos
		performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
		if err := qb.UpdateTattoos(performer.ID, performerTattoos); err != nil {
			return err
		}

		// Save the Piercings
		performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
		if err := qb.UpdatePiercings(performer.ID, performerPiercings); err != nil {
			return err
		}

		// Save the images
		// get the existing images
		existingImages, err := iqb.FindByPerformerID(performer.ID)

		performerImages := models.CreatePerformerImages(performer.ID, input.ImageIds)
		if err := jqb.UpdatePerformersImages(performer.ID, performerImages); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(&iqb)

		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	// Commit
	if err != nil {
		return nil, err
	}

	return performer, nil
}

func (r *mutationResolver) PerformerDestroy(ctx context.Context, input models.PerformerDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	performerID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}

	err = database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewPerformerQueryBuilder(txn.GetTx())
		iqb := models.NewImageQueryBuilder(txn.GetTx())

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly

		existingImages, err := iqb.FindByPerformerID(performerID)

		if err = qb.Destroy(performerID); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(&iqb)

		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return false, err
	}
	return true, nil
}
