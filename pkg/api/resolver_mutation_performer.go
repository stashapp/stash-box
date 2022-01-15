package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) PerformerCreate(ctx context.Context, input models.PerformerCreateInput) (*models.Performer, error) {
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

	fac := r.getRepoFactory(ctx)

	var performer *models.Performer
	err = fac.WithTxn(func() error {
		qb := fac.Performer()
		jqb := fac.Joins()

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
		performerUrls := models.CreatePerformerURLs(performer.ID, models.ParseURLInput(input.Urls))
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

		return jqb.CreatePerformersImages(performerImages)
	})

	// Commit
	if err != nil {
		return nil, err
	}

	return performer, nil
}

func (r *mutationResolver) PerformerUpdate(ctx context.Context, input models.PerformerUpdateInput) (*models.Performer, error) {
	fac := r.getRepoFactory(ctx)

	var performer *models.Performer
	err := fac.WithTxn(func() error {
		qb := fac.Performer()
		jqb := fac.Joins()
		iqb := fac.Image()

		// get the existing performer and modify it
		updatedPerformer, err := qb.Find(input.ID)

		if err != nil {
			return err
		}

		if updatedPerformer == nil {
			return models.NotFoundError(input.ID)
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
		performerUrls := models.CreatePerformerURLs(performer.ID, models.ParseURLInput(input.Urls))
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
		if err != nil {
			return err
		}

		performerImages := models.CreatePerformerImages(performer.ID, input.ImageIds)
		if err := jqb.UpdatePerformersImages(performer.ID, performerImages); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(iqb)

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
	fac := r.getRepoFactory(ctx)

	err := fac.WithTxn(func() error {
		qb := fac.Performer()
		iqb := fac.Image()

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly

		existingImages, err := iqb.FindByPerformerID(input.ID)
		if err != nil {
			return err
		}

		if err = qb.Destroy(input.ID); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(iqb)

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

func (r *mutationResolver) FavoritePerformer(ctx context.Context, id uuid.UUID, favorite bool) (bool, error) {
	fac := r.getRepoFactory(ctx)
	user := getCurrentUser(ctx)

	err := fac.WithTxn(func() error {
		jqb := r.getRepoFactory(ctx).Joins()
		if favorite {
			pf := models.PerformerFavorite{PerformerID: id, UserID: user.ID}
			err := jqb.AddPerformerFavorite(pf)
			return err
		} else {
			err := jqb.DestroyPerformerFavorite(models.PerformerFavorite{PerformerID: id, UserID: user.ID})
			return err
		}
	})
	return err == nil, err
}
