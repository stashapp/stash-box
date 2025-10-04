package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *queryResolver) QueryNotifications(ctx context.Context, input models.QueryNotificationsInput) (*models.QueryNotificationsResult, error) {
	return &models.QueryNotificationsResult{
		Input: input,
	}, nil
}

type queryNotificationsResolver struct{ *Resolver }

func (r *queryNotificationsResolver) Count(ctx context.Context, query *models.QueryNotificationsResult) (int, error) {
	currentUser := auth.GetCurrentUser(ctx)
	unreadOnly := query.Input.UnreadOnly != nil && *query.Input.UnreadOnly
	return r.services.Notification().GetNotificationsCount(ctx, currentUser.ID, unreadOnly)
}

func (r *queryNotificationsResolver) Notifications(ctx context.Context, query *models.QueryNotificationsResult) ([]models.Notification, error) {
	currentUser := auth.GetCurrentUser(ctx)
	unreadOnly := query.Input.UnreadOnly != nil && *query.Input.UnreadOnly
	return r.services.Notification().GetNotifications(ctx, currentUser.ID, unreadOnly)
}

func (r *queryResolver) GetUnreadNotificationCount(ctx context.Context) (int, error) {
	currentUser := auth.GetCurrentUser(ctx)
	return r.services.Notification().GetNotificationsCount(ctx, currentUser.ID, true)
}
