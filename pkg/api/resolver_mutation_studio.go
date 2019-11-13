package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) StudioCreate(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	return nil, nil
}

func (r *mutationResolver) StudioUpdate(ctx context.Context, input models.StudioUpdateInput) (*models.Studio, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	return nil, nil
}

func (r *mutationResolver) StudioDestroy(ctx context.Context, input models.StudioDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	return true, nil
}
