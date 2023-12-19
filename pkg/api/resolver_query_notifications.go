package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) GetUnreadNotificationCount(ctx context.Context) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	return qb.GetUnreadCount(currentUser.ID)
}

func (r *queryResolver) QueryNotifications(ctx context.Context, input models.NotificationQueryInput) ([]*models.Notification, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	return qb.GetNotifications(input, currentUser.ID)
}
