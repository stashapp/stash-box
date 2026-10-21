package fingerprintreport

import (
	"context"
	"fmt"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

type Service struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

func New(q *queries.Queries, withTxn queries.WithTxnFunc) *Service {
	return &Service{queries: q, withTxn: withTxn}
}

func toModel(r queries.FingerprintReport) models.FingerprintReport {
	return models.FingerprintReport{
		ID: r.ID, Hash: models.FingerprintHash(r.Hash), Algorithm: models.FingerprintAlgorithm(r.Algorithm),
		SceneID: r.SceneID, CorrectSceneID: r.CorrectSceneID, UserID: r.UserID, Comment: r.Comment,
		CreatedAt: r.CreatedAt, Status: models.FingerprintReportStatus(r.Status), ResolvedAt: r.ResolvedAt,
		ResolvedByID: r.ResolvedBy,
	}
}

func (s *Service) Create(ctx context.Context, input models.FingerprintReportInput) (*models.FingerprintReport, error) {
	var result models.FingerprintReport
	err := s.withTxn(func(q *queries.Queries) error {
		if _, err := q.LockFingerprintReportScene(ctx, input.SceneID); err != nil {
			return fmt.Errorf("source scene not found: %w", err)
		}
		exists, err := q.SubmittedHashExists(ctx, queries.SubmittedHashExistsParams{
			SceneID: input.SceneID, Hash: input.Hash.Int64(), Algorithm: input.Algorithm.String(),
		})
		if err != nil {
			return err
		}
		if !exists {
			return fmt.Errorf("fingerprint has no submissions on this scene")
		}
		target := uuid.NullUUID{}
		if input.CorrectSceneID != nil {
			if *input.CorrectSceneID == input.SceneID {
				return fmt.Errorf("correct scene must differ from the reported scene")
			}
			scene, err := q.FindScene(ctx, *input.CorrectSceneID)
			if err != nil {
				return fmt.Errorf("correct scene not found: %w", err)
			}
			if scene.Deleted {
				return fmt.Errorf("correct scene is deleted")
			}
			target = uuid.NullUUID{UUID: *input.CorrectSceneID, Valid: true}
		}
		if input.Comment != nil {
			comment := strings.TrimSpace(*input.Comment)
			if len(comment) > 10000 {
				return fmt.Errorf("comment must not exceed 10000 bytes")
			}
			input.Comment = nil
			if comment != "" {
				input.Comment = &comment
			}
		}
		row, err := q.CreateFingerprintReport(ctx, queries.CreateFingerprintReportParams{
			Hash: input.Hash.Int64(), Algorithm: input.Algorithm.String(), SceneID: input.SceneID,
			CorrectSceneID: target, UserID: uuid.NullUUID{UUID: auth.GetCurrentUser(ctx).ID, Valid: true}, Comment: input.Comment,
		})
		if err != nil {
			return err
		}
		result = toModel(row)
		return nil
	})
	return &result, err
}

func (s *Service) Query(ctx context.Context, status models.FingerprintReportStatus, page, perPage int) (*models.FingerprintReportsResult, error) {
	if page < 1 || perPage < 1 || perPage > 100 || page > 1000000 {
		return nil, fmt.Errorf("invalid pagination: page must be 1..1000000 and per_page 1..100")
	}
	count, err := s.queries.CountFingerprintReports(ctx, status.String())
	if err != nil {
		return nil, err
	}
	rows, err := s.queries.FindFingerprintReports(ctx, queries.FindFingerprintReportsParams{
		Status: status.String(), PageOffset: (page - 1) * perPage, PageSize: perPage,
	})
	if err != nil {
		return nil, err
	}
	result := &models.FingerprintReportsResult{Count: int(count), Reports: make([]models.FingerprintReport, 0, len(rows))}
	for _, row := range rows {
		result.Reports = append(result.Reports, toModel(row))
	}
	return result, nil
}

func (s *Service) Close(ctx context.Context, id uuid.UUID) (*models.FingerprintReport, error) {
	row, err := s.queries.CloseFingerprintReport(ctx, queries.CloseFingerprintReportParams{
		ID: id, ResolvedBy: uuid.NullUUID{UUID: auth.GetCurrentUser(ctx).ID, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("open report not found: %w", err)
	}
	result := toModel(row)
	return &result, nil
}

func (s *Service) Purge(ctx context.Context) error { return s.queries.PurgeFingerprintReports(ctx) }
