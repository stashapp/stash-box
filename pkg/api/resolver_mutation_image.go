package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	fac := r.getRepoFactory(ctx)

	var ret *models.Image
	err := fac.WithTxn(func() error {
		qb := fac.Image()
		imageService := image.GetService(qb)
		var txnErr error
		ret, txnErr = imageService.Create(input)

		return txnErr
	})

	if err != nil {
		return nil, err
	}

	return ret, nil
}

func (r *mutationResolver) ImageDestroy(ctx context.Context, input models.ImageDestroyInput) (bool, error) {
	fac := r.getRepoFactory(ctx)

	err := fac.WithTxn(func() error {
		qb := fac.Image()
		imageService := image.GetService(qb)
		return imageService.Destroy(input)
	})

	if err != nil {
		return false, err
	}

	return true, nil
}
