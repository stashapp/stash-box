package api

import (
	"context"
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FingerprintReports(ctx context.Context, status *models.FingerprintReportStatus, sceneID *uuid.UUID, page, perPage int) (*models.FingerprintReportsResult, error) {
	return r.services.FingerprintReport().Query(ctx, status, sceneID, page, perPage)
}

func (r *mutationResolver) ReportFingerprint(ctx context.Context, input models.FingerprintReportInput) (*models.FingerprintReport, error) {
	return r.services.FingerprintReport().Create(ctx, input)
}

func (r *mutationResolver) CloseFingerprintReport(ctx context.Context, id uuid.UUID) (*models.FingerprintReport, error) {
	return r.services.FingerprintReport().Close(ctx, id)
}

func (r *Resolver) FingerprintReport() models.FingerprintReportResolver {
	return &fingerprintReportResolver{r}
}

type fingerprintReportResolver struct{ *Resolver }

func (r *fingerprintReportResolver) Scene(ctx context.Context, obj *models.FingerprintReport) (*models.Scene, error) {
	return dataloader.For(ctx).SceneByID.Load(obj.SceneID)
}
func (r *fingerprintReportResolver) CorrectScene(ctx context.Context, obj *models.FingerprintReport) (*models.Scene, error) {
	if !obj.CorrectSceneID.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).SceneByID.Load(obj.CorrectSceneID.UUID)
}
func (r *fingerprintReportResolver) User(ctx context.Context, obj *models.FingerprintReport) (*models.User, error) {
	if !obj.UserID.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).UserByID.Load(obj.UserID.UUID)
}
func (r *fingerprintReportResolver) ResolvedBy(ctx context.Context, obj *models.FingerprintReport) (*models.User, error) {
	if !obj.ResolvedByID.Valid {
		return nil, nil
	}
	return dataloader.For(ctx).UserByID.Load(obj.ResolvedByID.UUID)
}
