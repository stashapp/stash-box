package api

import (
	"context"
)

func (r *queryResolver) GetUnreadNotificationCount(ctx context.Context) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	return qb.GetUnreadNotificationsCount(currentUser.ID)
}
