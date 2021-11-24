package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) TagCategoryCreate(ctx context.Context, input models.TagCategoryCreateInput) (*models.TagCategory, error) {
	if err := validateAdmin(ctx); err != nil {
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

	// Populate a new category from the input
	currentTime := time.Now()
	newCategory := models.TagCategory{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newCategory.CopyFromCreateInput(input)

	// Start the transaction and save the category
	fac := r.getRepoFactory(ctx)
	var category *models.TagCategory
	err = fac.WithTxn(func() error {
		qb := fac.TagCategory()
		category, err = qb.Create(newCategory)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *mutationResolver) TagCategoryUpdate(ctx context.Context, input models.TagCategoryUpdateInput) (*models.TagCategory, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)
	var category *models.TagCategory
	err := fac.WithTxn(func() error {
		qb := fac.TagCategory()

		// get the existing category and modify it
		categoryID, _ := uuid.FromString(input.ID)
		updatedCategory, err := qb.Find(categoryID)

		if err != nil {
			return err
		}

		updatedCategory.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate category from the input
		updatedCategory.CopyFromUpdateInput(input)

		category, err = qb.Update(*updatedCategory)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return category, nil
}

func (r *mutationResolver) TagCategoryDestroy(ctx context.Context, input models.TagCategoryDestroyInput) (bool, error) {
	if err := validateAdmin(ctx); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.TagCategory()

		categoryID, err := uuid.FromString(input.ID)
		if err != nil {
			return err
		}
		if err = qb.Destroy(categoryID); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return false, err
	}
	return true, nil
}
