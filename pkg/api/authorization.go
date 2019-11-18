package api

import (
	"context"
	"errors"
)

const ReadRole = "read"
const ModifyRole = "modify"

func validateRole(ctx context.Context, requiredRole string) error {
	role := ctx.Value(ContextRole)
	valid := true

	switch requiredRole {
	case ReadRole:
		valid = role == ReadRole || role == ModifyRole
	case ModifyRole:
		valid = role == ModifyRole
	}

	if !valid {
		return errors.New("Not authorized")
	}

	return nil
}

func validateRead(ctx context.Context) error {
	return validateRole(ctx, ReadRole)
}

func validateModify(ctx context.Context) error {
	return validateRole(ctx, ModifyRole)
}
