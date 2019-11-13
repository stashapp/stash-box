package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type studioResolver struct{ *Resolver }

func (r *studioResolver) Urls(ctx context.Context, obj *models.Studio) ([]*models.URL, error) {
	panic("not implemented")
}
func (r *studioResolver) Parent(ctx context.Context, obj *models.Studio) (*models.Studio, error) {
	panic("not implemented")
}
func (r *studioResolver) AddedChildStudios(ctx context.Context, obj *models.Studio) ([]*models.Studio, error) {
	panic("not implemented")
}
