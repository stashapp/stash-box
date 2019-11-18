package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type sceneResolver struct{ *Resolver }

func (r *sceneResolver) Title(ctx context.Context, obj *models.Scene) (*string, error) {
	panic("not implemented")
}

func (r *sceneResolver) Details(ctx context.Context, obj *models.Scene) (*string, error) {
	panic("not implemented")
}

func (r *sceneResolver) URL(ctx context.Context, obj *models.Scene) (*string, error) {
	panic("not implemented")
}

func (r *sceneResolver) Date(ctx context.Context, obj *models.Scene) (*string, error) {
	panic("not implemented")
}

func (r *sceneResolver) Studio(ctx context.Context, obj *models.Scene) (*models.Studio, error) {
	panic("not implemented")
}

func (r *sceneResolver) Tags(ctx context.Context, obj *models.Scene) ([]*models.Tag, error) {
	panic("not implemented")
}

func (r *sceneResolver) Performers(ctx context.Context, obj *models.Scene) ([]*models.Performer, error) {
	panic("not implemented")
}

func (r *sceneResolver) Checksums(ctx context.Context, obj *models.Scene) ([]string, error) {
	panic("not implemented")
}
