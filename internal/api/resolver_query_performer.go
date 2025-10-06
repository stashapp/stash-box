package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FindPerformer(ctx context.Context, id uuid.UUID) (*models.Performer, error) {
	return r.services.Performer().FindByID(ctx, id)
}

func (r *queryResolver) QueryPerformers(ctx context.Context, input models.PerformerQueryInput) (*models.PerformerQuery, error) {
	return &models.PerformerQuery{
		Filter: input,
	}, nil
}

type queryPerformerResolver struct{ *Resolver }

func (r *queryPerformerResolver) Count(ctx context.Context, obj *models.PerformerQuery) (int, error) {
	return r.services.Performer().QueryCount(ctx, obj.Filter)
}

func (r *queryPerformerResolver) Performers(ctx context.Context, obj *models.PerformerQuery) ([]models.Performer, error) {
	return r.services.Performer().Query(ctx, obj.Filter)
}

func (r *queryResolver) QueryExistingPerformer(ctx context.Context, input models.QueryExistingPerformerInput) (*models.QueryExistingPerformerResult, error) {
	return &models.QueryExistingPerformerResult{
		Input: input,
	}, nil
}

type queryExistingPerformerResolver struct{ *Resolver }

func (r *queryExistingPerformerResolver) Edits(ctx context.Context, obj *models.QueryExistingPerformerResult) ([]models.Edit, error) {
	return r.services.Edit().FindPendingPerformerCreation(ctx, obj.Input)
}

func (r *queryExistingPerformerResolver) Performers(ctx context.Context, obj *models.QueryExistingPerformerResult) ([]models.Performer, error) {
	return r.services.Performer().FindExistingPerformers(ctx, obj.Input)
}

func (r *queryResolver) SearchPerformer(ctx context.Context, term string, limit *int) ([]models.Performer, error) {
	return r.services.Performer().SearchPerformer(ctx, term, limit)
}
