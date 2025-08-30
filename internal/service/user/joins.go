package user

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
)

func createRoles(ctx context.Context, tx *db.Queries, userID uuid.UUID, roles []models.RoleEnum) error {
	var params []db.CreateUserRolesParams
	for _, role := range roles {
		params = append(params, db.CreateUserRolesParams{
			UserID: userID,
			Role:   role.String(),
		})
	}
	_, err := tx.CreateUserRoles(ctx, params)
	return err
}

func updateRoles(ctx context.Context, tx *db.Queries, userID uuid.UUID, roles []models.RoleEnum) error {
	if err := tx.DeleteUserRoles(ctx, userID); err != nil {
		return err
	}
	return createRoles(ctx, tx, userID, roles)
}

func createNotificationSubscriptions(ctx context.Context, tx *db.Queries, userID uuid.UUID, subscriptions []models.NotificationEnum) error {
	var params []db.CreateUserNotificationSubscriptionsParams
	for _, sub := range subscriptions {
		params = append(params, db.CreateUserNotificationSubscriptionsParams{
			UserID: userID,
			Type:   db.NotificationType(sub.String()),
		})
	}
	_, err := tx.CreateUserNotificationSubscriptions(ctx, params)
	return err
}
