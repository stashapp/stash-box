package api

import (
	"context"
	"fmt"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) StudioCreate(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new studio from the input
	currentTime := time.Now()
	newStudio := models.Studio{
		ID:        UUID,
		CreatedAt: currentTime,
		UpdatedAt: currentTime,
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

		// Save the aliases
		studioAliases := models.CreateStudioAliases(studio.ID, input.Aliases)
		if err := qb.CreateAliases(studioAliases); err != nil {
			return err
		}

		// Save the URLs
		studioUrls := models.CreateStudioURLs(studio.ID, models.ParseURLInput(input.Urls))
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
	fac := r.getRepoFactory(ctx)

	var studio *models.Studio
	err := fac.WithTxn(func() error {
		qb := fac.Studio()
		jqb := fac.Joins()
		iqb := fac.Image()

		// Get the existing studio and modify it
		updatedStudio, err := qb.Find(input.ID)

		if err != nil {
			return err
		}

		updatedStudio.UpdatedAt = time.Now()

		// Populate studio from the input
		updatedStudio.CopyFromUpdateInput(input)

		studio, err = qb.Update(*updatedStudio)
		if err != nil {
			return err
		}

		// Save the URLs
		// TODO - only do this if provided
		studioUrls := models.CreateStudioURLs(studio.ID, models.ParseURLInput(input.Urls))
		if err := qb.UpdateURLs(studio.ID, studioUrls); err != nil {
			return err
		}

		// Save the aliases
		studioAliases := models.CreateStudioAliases(studio.ID, input.Aliases)
		if err := qb.UpdateAliases(studio.ID, studioAliases); err != nil {
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
	fac := r.getRepoFactory(ctx)

	err := fac.WithTxn(func() error {
		qb := fac.Studio()
		iqb := fac.Image()

		existingImages, err := iqb.FindByStudioID(input.ID)
		if err != nil {
			return err
		}

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly
		if err = qb.Destroy(input.ID); err != nil {
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

func (r *mutationResolver) FavoriteStudio(ctx context.Context, id uuid.UUID, favorite bool) (bool, error) {
	fac := r.getRepoFactory(ctx)
	user := getCurrentUser(ctx)

	err := fac.WithTxn(func() error {
		jqb := fac.Joins()
		studio, err := fac.Studio().Find(id)
		if err != nil {
			return err
		}
		if studio.Deleted {
			return fmt.Errorf("studio is deleted, unable to make favorite")
		}

		studioFavorite := models.StudioFavorite{StudioID: id, UserID: user.ID}
		if favorite {
			err := jqb.AddStudioFavorite(studioFavorite)
			return err
		}
		return jqb.DestroyStudioFavorite(studioFavorite)
	})
	return err == nil, err
}
