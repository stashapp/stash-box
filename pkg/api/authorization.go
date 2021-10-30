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

func validateRead(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumRead)
}

func validateModify(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumModify)
}

func validateEdit(ctx context.Context) error {
	return user.ValidateRole(ctx, models.RoleEnumEdit)
}

func validateVote(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumVote)
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
