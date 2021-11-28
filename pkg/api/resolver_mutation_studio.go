package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) StudioCreate(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new studio from the input
	currentTime := time.Now()
	newStudio := models.Studio{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newStudio.CopyFromCreateInput(input)
	fac := r.getRepoFactory(ctx)

	var studio *models.Studio
	err = fac.WithTxn(func() error {
		qb := fac.Studio()
		jqb := fac.Joins()

		var err error
		studio, err = qb.Create(newStudio)
		if err != nil {
			return err
		}

		// Save the URLs
		studioUrls := models.CreateStudioURLs(studio.ID, input.Urls)
		if err := qb.CreateURLs(studioUrls); err != nil {
			return err
		}

		// Save the images
		studioImages := models.CreateStudioImages(studio.ID, input.ImageIds)
		return jqb.CreateStudiosImages(studioImages)
	})

	return studio, err
}

func (r *mutationResolver) StudioUpdate(ctx context.Context, input models.StudioUpdateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var studio *models.Studio
	err := fac.WithTxn(func() error {
		qb := fac.Studio()
		jqb := fac.Joins()
		iqb := fac.Image()

		// Get the existing studio and modify it
		studioID, _ := uuid.FromString(input.ID)
		updatedStudio, err := qb.Find(studioID)
		if err != nil {
			return err
		}

		updatedStudio.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate studio from the input
		updatedStudio.CopyFromUpdateInput(input)

		studio, err = qb.Update(*updatedStudio)
		if err != nil {
			return err
		}

		// Save the URLs
		// TODO - only do this if provided
		studioUrls := models.CreateStudioURLs(studio.ID, input.Urls)
		if err := qb.UpdateURLs(studio.ID, studioUrls); err != nil {
			return err
		}

		// Get the existing images
		existingImages, err := iqb.FindByStudioID(studio.ID)
		if err != nil {
			return err
		}

		// Save the images
		studioImages := models.CreateStudioImages(studio.ID, input.ImageIds)
		if err := jqb.UpdateStudiosImages(studio.ID, studioImages); err != nil {
			return err
		}

		// Remove images that are no longer used
		imageService := image.GetService(iqb)
		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	return studio, err
}

func (r *mutationResolver) StudioDestroy(ctx context.Context, input models.StudioDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	studioID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	err = fac.WithTxn(func() error {
		qb := fac.Studio()
		iqb := fac.Image()

		existingImages, err := iqb.FindByStudioID(studioID)
		if err != nil {
			return err
		}

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly
		if err = qb.Destroy(studioID); err != nil {
			return err
		}

		// Remove images that are no longer used
		imageService := image.GetService(iqb)
		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	return err == nil, err
}
