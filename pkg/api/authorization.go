package api

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

var ErrUnauthorized = errors.New("Not authorized")

func getCurrentUser(ctx context.Context) *models.User {
	userCtxVal := ctx.Value(ContextUser)
	if userCtxVal != nil {
		currentUser := userCtxVal.(*models.User)
		return currentUser
	}

	return nil
}

func validateRole(ctx context.Context, requiredRole models.RoleEnum) error {
	var roles []models.RoleEnum

	roleCtxVal := ctx.Value(ContextRoles)
	if roleCtxVal != nil {
		roles = roleCtxVal.([]models.RoleEnum)
	}

	valid := false

	for _, role := range roles {
		if role.Implies(requiredRole) {
			valid = true
			break
		}
	}

	if !valid {
		return ErrUnauthorized
	}

	return nil
}

func validateRead(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumRead)
}

func validateModify(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumModify)
}

func validateEdit(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumEdit)
}

func validateVote(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumVote)
}

func validateInvite(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumInvite)
}

func validateManageInvites(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumManageInvites)
}

func validateAdmin(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumAdmin)
}

func validateUser(ctx context.Context, userID uuid.UUID) error {
	user := getCurrentUser(ctx)
	if user != nil && user.ID == userID {
		return nil
	}

	return ErrUnauthorized
}
