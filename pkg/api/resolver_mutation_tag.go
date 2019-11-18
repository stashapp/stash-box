package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) TagCreate(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	return nil, nil
}

func (r *mutationResolver) TagUpdate(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	return nil, nil
}

func (r *mutationResolver) TagDestroy(ctx context.Context, input models.TagDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	return true, nil
}
