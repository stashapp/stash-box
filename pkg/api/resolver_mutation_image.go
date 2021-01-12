package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/image"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var ret *models.Image
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewImageQueryBuilder(txn.GetTx())
		imageService := image.Service{
			Repository: &qb,
		}
		var txnErr error
		ret, txnErr = imageService.Create(input)

		return txnErr
	})

	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (r *mutationResolver) ImageUpdate(ctx context.Context, input models.ImageUpdateInput) (*models.Image, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var ret *models.Image
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewImageQueryBuilder(txn.GetTx())
		imageService := image.Service{
			Repository: &qb,
		}
		var txnErr error
		ret, txnErr = imageService.Update(input)

		return txnErr
	})

	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewImageQueryBuilder(txn.GetTx())
		imageService := image.Service{
			Repository: &qb,
		}
		return imageService.Destroy(input)
	})

	if err != nil {
		return false, err
	}

	return true, nil
}
