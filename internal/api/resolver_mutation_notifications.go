package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) MarkNotificationsRead(ctx context.Context, notification *models.MarkNotificationReadInput) (bool, error) {
	user := auth.GetCurrentUser(ctx)
	if notification == nil {
		err := r.services.Notification().MarkAllRead(ctx, user.ID)
		return err == nil, err
	}

	err := r.services.Notification().MarkRead(ctx, user.ID, notification.Type, notification.ID)
	return err == nil, err
}

func (r *mutationResolver) UpdateNotificationSubscriptions(ctx context.Context, subscriptions []models.NotificationEnum) (bool, error) {
	user := auth.GetCurrentUser(ctx)
	err := r.services.Notification().UpdateNotificationSubscriptions(ctx, user.ID, subscriptions)

	return err == nil, err
}
