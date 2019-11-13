package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type tagResolver struct{ *Resolver }

func (r *tagResolver) Description(ctx context.Context, obj *models.Tag) (*string, error) {
	panic("not implemented")
}
func (r *tagResolver) Aliases(ctx context.Context, obj *models.Tag) ([]string, error) {
	panic("not implemented")
}
