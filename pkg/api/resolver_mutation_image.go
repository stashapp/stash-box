package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) ImageCreate(ctx context.Context, input models.ImageCreateInput) (*models.Image, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var ret *models.Image
	err := fac.WithTxn(func() error {
		qb := fac.Image()
		imageService := image.GetService(qb)

		file := make([]byte, input.File.Size)
		if _, err := input.File.File.Read(file); err != nil {
			return err
		}

		var txnErr error
		ret, txnErr = imageService.Create(input.URL, file)

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
