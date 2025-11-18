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

	if auth.IsRole(ctx, models.RoleEnumEdit) {
		err := r.services.Notification().UpdateNotificationSubscriptions(ctx, user.ID, subscriptions)
		return err == nil, err
	}

	isFavoriteSubscription := map[models.NotificationEnum]bool{
		models.NotificationEnumFavoritePerformerScene: true,
		models.NotificationEnumFavoritePerformerEdit:  true,
		models.NotificationEnumFavoriteStudioScene:    true,
		models.NotificationEnumFavoriteStudioEdit:     true,
	}

	var filteredSubscriptions []models.NotificationEnum
	for _, s := range subscriptions {
		if isFavoriteSubscription[s] {
			filteredSubscriptions = append(filteredSubscriptions, s)
		}
	}

	err := r.services.Notification().UpdateNotificationSubscriptions(ctx, user.ID, filteredSubscriptions)
	return err == nil, err
}
