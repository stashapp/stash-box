package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) QueryNotifications(ctx context.Context, input models.QueryNotificationsInput) (*models.QueryNotificationsResult, error) {
	return &models.QueryNotificationsResult{
		Input: input,
	}, nil
}

type queryNotificationsResolver struct{ *Resolver }

func (r *queryNotificationsResolver) Count(ctx context.Context, query *models.QueryNotificationsResult) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	return qb.GetNotificationsCount(currentUser.ID)
}

func (r *queryNotificationsResolver) Notifications(ctx context.Context, query *models.QueryNotificationsResult) ([]*models.Notification, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	return qb.GetNotifications(query.Input, currentUser.ID)
}
