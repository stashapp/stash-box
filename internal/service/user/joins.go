package user

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/models"
)

func createRoles(ctx context.Context, tx *queries.Queries, userID uuid.UUID, roles []models.RoleEnum) error {
	var params []queries.CreateUserRolesParams
	for _, role := range roles {
		params = append(params, queries.CreateUserRolesParams{
			UserID: userID,
			Role:   role.String(),
		})
	}
	_, err := tx.CreateUserRoles(ctx, params)
	return err
}

func updateRoles(ctx context.Context, tx *queries.Queries, userID uuid.UUID, roles []models.RoleEnum) error {
	if err := tx.DeleteUserRoles(ctx, userID); err != nil {
		return err
	}
	return createRoles(ctx, tx, userID, roles)
}

func createNotificationSubscriptions(ctx context.Context, tx *queries.Queries, userID uuid.UUID, subscriptions []models.NotificationEnum) error {
	var params []queries.CreateUserNotificationSubscriptionsParams
	for _, sub := range subscriptions {
		params = append(params, queries.CreateUserNotificationSubscriptionsParams{
			UserID: userID,
			Type:   queries.NotificationType(sub.String()),
		})
	}
	_, err := tx.CreateUserNotificationSubscriptions(ctx, params)
	return err
}
