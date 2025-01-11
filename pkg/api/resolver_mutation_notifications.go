package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) MarkNotificationsRead(ctx context.Context, notification *models.MarkNotificationReadInput) (bool, error) {
	user := getCurrentUser(ctx)
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Notification()

		if notification == nil {
			return qb.MarkAllRead(user.ID)
		}

		return qb.MarkRead(user.ID, notification.Type, notification.ID)
	})
	return err == nil, err
}

func (r *mutationResolver) UpdateNotificationSubscriptions(ctx context.Context, subscriptions []models.NotificationEnum) (bool, error) {
	user := getCurrentUser(ctx)
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Joins()
		var userNotifications []*models.UserNotification
		for _, s := range subscriptions {
			userNotification := models.UserNotification{UserID: user.ID, Type: s}
			userNotifications = append(userNotifications, &userNotification)
		}
		return qb.UpdateUserNotifications(user.ID, userNotifications)
	})

	return err == nil, err
}
