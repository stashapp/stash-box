package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

var ErrUnauthorized = errors.New("Not authorized")

func getCurrentUser(ctx context.Context) *models.User {
	return user.GetCurrentUser(ctx)
}

func isRole(ctx context.Context, requiredRole models.RoleEnum) bool {
	return user.IsRole(ctx, requiredRole)
}

func validateRead(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumRead)
}

func validateModify(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumModify)
}

func validateEdit(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumEdit)
}

func validateInvite(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumInvite)
}

func validateManageInvites(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumManageInvites)
}

func validateAdmin(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumAdmin)
}

func validateOwner(ctx context.Context, userID uuid.UUID) error {
	return user.ValidateOwner(ctx, userID)
}
