package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func getCurrentUser(ctx context.Context) *models.User {
	return user.GetCurrentUser(ctx)
}

func validateVote(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumVote)
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

func validateUser(ctx context.Context, userID uuid.UUID) error {
	return user.ValidateOwner(ctx, userID)
}

func validateUserOrAdmin(ctx context.Context, userID uuid.UUID) error {
	if err := user.ValidateOwner(ctx, userID); err == nil {
		return nil
	}
	return user.ValidateRole(ctx, models.RoleEnumAdmin)
}
