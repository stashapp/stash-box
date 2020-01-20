package api

import (
	"context"
	"errors"

	"github.com/stashapp/stashdb/pkg/models"
)

var ErrUnauthorized = errors.New("Not authorized")

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

func validateAdmin(ctx context.Context) error {
	return validateRole(ctx, models.RoleEnumAdmin)
}
