package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *queryResolver) FindPerformer(ctx context.Context, id uuid.UUID) (*models.Performer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()

	return qb.Find(id)
}

func (r *queryResolver) QueryPerformers(ctx context.Context, input models.PerformerQueryInput) (*models.PerformerQuery, error) {
	return &models.PerformerQuery{
		Filter: input,
	}, nil
}

type queryPerformerResolver struct{ *Resolver }

func (r *queryPerformerResolver) Count(ctx context.Context, obj *models.PerformerQuery) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()
	user := user.GetCurrentUser(ctx)
	return qb.QueryCount(obj.Filter, user.ID)
}

func (r *queryPerformerResolver) Performers(ctx context.Context, obj *models.PerformerQuery) ([]*models.Performer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()
	user := user.GetCurrentUser(ctx)
	return qb.QueryPerformers(obj.Filter, user.ID)
}

func (r *queryResolver) QueryExistingPerformer(ctx context.Context, input models.QueryExistingPerformerInput) (*models.QueryExistingPerformerResult, error) {
	return &models.QueryExistingPerformerResult{
		Input: input,
	}, nil
}

type queryExistingPerformerResolver struct{ *Resolver }

func (r *queryExistingPerformerResolver) Edits(ctx context.Context, obj *models.QueryExistingPerformerResult) ([]*models.Edit, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Edit()
	return qb.FindPendingPerformerCreation(obj.Input)
}

func (r *queryExistingPerformerResolver) Performers(ctx context.Context, obj *models.QueryExistingPerformerResult) ([]*models.Performer, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Performer()
	return qb.FindExistingPerformers(obj.Input)
}
