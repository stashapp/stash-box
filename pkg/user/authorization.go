package user

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type key int

const (
	ContextUser key = iota
	ContextRoles
)

const APIKeyHeader = "ApiKey"

var ErrUnauthorized = errors.New("Not authorized")

func GetCurrentUser(ctx context.Context) *models.User {
	userCtxVal := ctx.Value(ContextUser)
	if userCtxVal != nil {
		currentUser := userCtxVal.(*models.User)
		return currentUser
	}

	return nil
}

func IsRole(ctx context.Context, requiredRole models.RoleEnum) bool {
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

	return valid
}

func ValidateRole(ctx context.Context, requiredRole models.RoleEnum) error {
	if !IsRole(ctx, requiredRole) {
		return ErrUnauthorized
	}

	return nil
}

func ValidateRead(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumRead)
}

func ValidateModify(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumModify)
}

func ValidateEdit(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumEdit)
}

func ValidateInvite(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumInvite)
}

func ValidateManageInvites(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumManageInvites)
}

func ValidateAdmin(ctx context.Context) error {
	return ValidateRole(ctx, models.RoleEnumAdmin)
}

func ValidateOwner(ctx context.Context, userID uuid.UUID) error {
	err := ValidateAdmin(ctx)
	if err == nil {
		return nil
	}

	user := GetCurrentUser(ctx)
	if user != nil && user.ID == userID {
		return nil
	}

	return ErrUnauthorized
}
