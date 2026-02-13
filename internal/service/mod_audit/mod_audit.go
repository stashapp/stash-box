package mod_audit

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// ModAuditService handles mod audit operations
type ModAuditService struct {
	queries *queries.Queries
}

// NewModAuditService creates a new mod audit service
func NewModAuditService(queries *queries.Queries) *ModAuditService {
	return &ModAuditService{
		queries: queries,
	}
}

// GetModAuditCount returns the total count of audits matching the filter
func (s *ModAuditService) GetModAuditCount(ctx context.Context, filter models.ModAuditQueryInput) (int, error) {
	var action queries.NullModAuditAction
	if filter.Action != nil {
		action = queries.NullModAuditAction{
			ModAuditAction: queries.ModAuditAction(filter.Action.String()),
			Valid:          true,
		}
	}

	var userID uuid.NullUUID
	if filter.UserID != nil {
		userID = uuid.NullUUID{UUID: *filter.UserID, Valid: true}
	}

	count, err := s.queries.GetModAuditCount(ctx, queries.GetModAuditCountParams{
		Action: action,
		UserID: userID,
	})
	if err != nil {
		return 0, err
	}

	return int(count), nil
}

// QueryModAudits returns audits matching the filter with pagination
func (s *ModAuditService) QueryModAudits(ctx context.Context, filter models.ModAuditQueryInput) ([]*models.ModAudit, error) {
	var action queries.NullModAuditAction
	if filter.Action != nil {
		action = queries.NullModAuditAction{
			ModAuditAction: queries.ModAuditAction(filter.Action.String()),
			Valid:          true,
		}
	}

	var userID uuid.NullUUID
	if filter.UserID != nil {
		userID = uuid.NullUUID{UUID: *filter.UserID, Valid: true}
	}

	offset := (filter.Page - 1) * filter.PerPage
	limit := filter.PerPage

	dbAudits, err := s.queries.QueryModAudits(ctx, queries.QueryModAuditsParams{
		Action: action,
		UserID: userID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return nil, err
	}

	audits := make([]*models.ModAudit, len(dbAudits))
	for i, dbAudit := range dbAudits {
		// Convert json.RawMessage to string for GraphQL
		dataStr := string(dbAudit.Data)

		audit := &models.ModAudit{
			ID:         dbAudit.ID,
			Action:     string(dbAudit.Action),
			UserID:     dbAudit.UserID,
			TargetID:   dbAudit.TargetID,
			TargetType: dbAudit.TargetType,
			Data:       dataStr,
			Reason:     dbAudit.Reason,
			CreatedAt:  dbAudit.CreatedAt,
		}
		audits[i] = audit
	}

	return audits, nil
}

// DeleteExpired removes mod audit records older than the specified number of days
func (s *ModAuditService) DeleteExpired(ctx context.Context, retentionDays int) error {
	if retentionDays <= 0 {
		return nil
	}

	return s.queries.DeleteExpiredModAudits(ctx, int32(retentionDays))
}
