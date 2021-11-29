package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type tagEditResolver struct{ *Resolver }

func (r *tagEditResolver) Category(ctx context.Context, obj *models.TagEdit) (*models.TagCategory, error) {
	if obj.CategoryID == nil {
		return nil, nil
	}

	qb := r.getRepoFactory(ctx).TagCategory()
	categoryID, _ := uuid.FromString(*obj.CategoryID)
	return qb.Find(categoryID)
}
