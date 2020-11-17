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
		var txnErr error
		ret, txnErr = image.Create(&qb, input)

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
		var txnErr error
		ret, txnErr = image.Update(&qb, input)

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
		return image.Destroy(&qb, input)
	})

	if err != nil {
		return false, err
	}

	return true, nil
}
