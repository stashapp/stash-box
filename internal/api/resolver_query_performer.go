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
	if obj.SearchResults != nil {
		return obj.SearchResults.Count, nil
	}
	return r.services.Performer().QueryCount(ctx, obj.Filter)
}

func (r *queryPerformerResolver) Performers(ctx context.Context, obj *models.PerformerQuery) ([]models.Performer, error) {
	if obj.SearchResults != nil {
		return obj.SearchResults.Performers, nil
	}
	return r.services.Performer().Query(ctx, obj.Filter)
}

func (r *queryPerformerResolver) Facets(ctx context.Context, obj *models.PerformerQuery) (*models.PerformerSearchFacets, error) {
	if obj.SearchResults != nil {
		return obj.SearchResults.Facets, nil
	}
	return nil, nil
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

// Deprecated: Use SearchPerformers instead
func (r *queryResolver) SearchPerformer(ctx context.Context, term string, limit *int) ([]models.Performer, error) {
	result, err := r.services.Performer().SearchPerformer(ctx, term, limit, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	if result.SearchResults != nil {
		return result.SearchResults.Performers, nil
	}
	return nil, nil
}

func (r *queryResolver) SearchPerformers(ctx context.Context, term string, limit *int, page *int, perPage *int, filter *models.PerformerSearchFilter) (*models.PerformerQuery, error) {
	return r.services.Performer().SearchPerformer(ctx, term, limit, page, perPage, filter)
}
