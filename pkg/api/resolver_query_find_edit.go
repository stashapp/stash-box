package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindEdit(ctx context.Context, id uuid.UUID) (*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()

	return qb.Find(id)
}

func (r *queryResolver) QueryEdits(ctx context.Context, input models.EditQueryInput) (*models.EditQuery, error) {
	return &models.EditQuery{
		Filter: input,
	}, nil
}

type queryEditResolver struct{ *Resolver }

func (r *queryEditResolver) Count(ctx context.Context, obj *models.EditQuery) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	u := user.GetCurrentUser(ctx)
	return qb.QueryCount(obj.Filter, u.ID)
}

func (r *queryEditResolver) Edits(ctx context.Context, obj *models.EditQuery) ([]*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	u := user.GetCurrentUser(ctx)
	return qb.QueryEdits(obj.Filter, u.ID)
}
