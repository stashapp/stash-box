package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

type tagEditResolver struct{ *Resolver }

func (r *tagEditResolver) Category(ctx context.Context, obj *models.TagEdit) (*models.TagCategory, error) {
	if obj.CategoryID == nil {
		return nil, nil
	}

	return r.services.Tag().FindCategory(ctx, *obj.CategoryID)
}

func (r *tagEditResolver) Aliases(ctx context.Context, obj *models.TagEdit) ([]string, error) {
	return r.services.Edit().GetMergedStudioAliases(ctx, obj.EditID)
}
