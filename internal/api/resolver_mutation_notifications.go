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

	// General notifications are available to everyone. Voting and editing
	// notifications require the corresponding role.
	allowed := map[models.NotificationEnum]bool{
		models.NotificationEnumFavoritePerformerScene: true,
		models.NotificationEnumFavoritePerformerEdit:  true,
		models.NotificationEnumFavoriteStudioScene:    true,
		models.NotificationEnumFavoriteStudioEdit:     true,
		models.NotificationEnumFingerprintedSceneEdit: true,
		models.NotificationEnumFingerprintMoved:       true,
	}

	if auth.IsRole(ctx, models.RoleEnumVote) {
		allowed[models.NotificationEnumUpdatedEdit] = true
		allowed[models.NotificationEnumCommentVotedEdit] = true
	}

	if auth.IsRole(ctx, models.RoleEnumEdit) {
		allowed[models.NotificationEnumCommentOwnEdit] = true
		allowed[models.NotificationEnumDownvoteOwnEdit] = true
		allowed[models.NotificationEnumFailedOwnEdit] = true
		allowed[models.NotificationEnumCommentCommentedEdit] = true
	}

	var filteredSubscriptions []models.NotificationEnum
	for _, s := range subscriptions {
		if allowed[s] {
			filteredSubscriptions = append(filteredSubscriptions, s)
		}
	}

	err := r.services.Notification().UpdateNotificationSubscriptions(ctx, user.ID, filteredSubscriptions)
	return err == nil, err
}
