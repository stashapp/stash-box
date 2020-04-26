package api

import (
	"context"
	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var err error

	if err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	newImage := models.Image {
		ID:        UUID,
	}

	newImage.CopyFromCreateInput(input)

	// Start the transaction and save the performer
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewImageQueryBuilder(tx)
	image, err := qb.Create(newImage)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return image, nil
}

func (r *mutationResolver) ImageUpdate(ctx context.Context, input models.ImageUpdateInput) (*models.Image, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewImageQueryBuilder(tx)

	// get the existing image and modify it
	imageID, _ := uuid.FromString(input.ID)
	updatedImage, err := qb.Find(imageID)

	if err != nil {
		return nil, err
	}

	// Populate performer from the input
	updatedImage.CopyFromUpdateInput(input)

	image, err := qb.Update(*updatedImage)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return image, nil
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewImageQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	imageID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(imageID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
