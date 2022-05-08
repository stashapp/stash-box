package api

import (
	"context"
	"errors"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/sqlx"
)

type tagEditResolver struct{ *Resolver }

func (r *tagEditResolver) Category(ctx context.Context, obj *models.TagEdit) (*models.TagCategory, error) {
	if obj.CategoryID == nil {
		return nil, nil
	}

	qb := r.getRepoFactory(ctx).TagCategory()
	return qb.Find(*obj.CategoryID)
}

func (r *tagEditResolver) Aliases(ctx context.Context, obj *models.TagEdit) ([]string, error) {
	fac := r.getRepoFactory(ctx)
	id, err := fac.Edit().FindTagID(obj.EditID)
	if err != nil && !errors.Is(err, sqlx.ErrEditTargetIDNotFound) {
		return nil, err
	}

	return fac.Tag().GetEditAliases(id, obj)
}
