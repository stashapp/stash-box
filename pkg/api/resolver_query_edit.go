package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) FindEdit(ctx context.Context, id uuid.UUID) (*models.Edit, error) {
	return r.services.Edit().FindByID(ctx, id)
}

func (r *queryResolver) QueryEdits(ctx context.Context, input models.EditQueryInput) (*models.EditQuery, error) {
	return &models.EditQuery{
		Filter: input,
	}, nil
}

type queryEditResolver struct{ *Resolver }

func (r *queryEditResolver) Count(ctx context.Context, obj *models.EditQuery) (int, error) {
	return r.services.Edit().QueryCount(ctx, obj.Filter)
}

func (r *queryEditResolver) Edits(ctx context.Context, obj *models.EditQuery) ([]models.Edit, error) {
	return r.services.Edit().QueryEdits(ctx, obj.Filter)
}
