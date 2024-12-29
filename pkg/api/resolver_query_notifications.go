package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) GetUnreadNotificationCount(ctx context.Context) (int, error) {
	fac := r.getRepoFactory(ctx)
	qb := fac.Notification()
	currentUser := getCurrentUser(ctx)
	unread := true
	return qb.GetNotificationsCount(currentUser.ID, models.QueryNotificationsInput{UnreadOnly: &unread})
}
