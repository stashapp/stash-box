package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) QueryModAudits(ctx context.Context, input models.ModAuditQueryInput) (*models.ModAuditQuery, error) {
	return &models.ModAuditQuery{
		Filter: input,
	}, nil
}

type queryModAuditResolver struct{ *Resolver }

func (r *queryModAuditResolver) Count(ctx context.Context, obj *models.ModAuditQuery) (int, error) {
	return r.services.ModAudit().GetModAuditCount(ctx, obj.Filter)
}

func (r *queryModAuditResolver) Audits(ctx context.Context, obj *models.ModAuditQuery) ([]models.ModAudit, error) {
	audits, err := r.services.ModAudit().QueryModAudits(ctx, obj.Filter)
	if err != nil {
		return nil, err
	}

	// Convert from []*models.ModAudit to []models.ModAudit
	result := make([]models.ModAudit, len(audits))
	for i, audit := range audits {
		result[i] = *audit
	}
	return result, nil
}

type modAuditResolver struct{ *Resolver }

func (r *modAuditResolver) Action(ctx context.Context, obj *models.ModAudit) (models.ModAuditActionEnum, error) {
	return models.ModAuditActionEnum(obj.Action), nil
}

func (r *modAuditResolver) User(ctx context.Context, obj *models.ModAudit) (*models.User, error) {
	if !obj.UserID.Valid {
		return nil, nil
	}
	return r.services.User().FindByID(ctx, obj.UserID.UUID)
}
