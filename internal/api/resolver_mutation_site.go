package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SiteCreate(ctx context.Context, input models.SiteCreateInput) (*models.Site, error) {
	return r.services.Site().Create(ctx, input)
}

func (r *mutationResolver) SiteUpdate(ctx context.Context, input models.SiteUpdateInput) (*models.Site, error) {
	return r.services.Site().Update(ctx, input)
}

func (r *mutationResolver) SiteDestroy(ctx context.Context, input models.SiteDestroyInput) (bool, error) {
	err := r.services.Site().Destroy(ctx, input.ID)
	return err == nil, err
}
