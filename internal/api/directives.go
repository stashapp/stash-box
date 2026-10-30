package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func IsUserOwnerDirective(ctx context.Context, obj any, next graphql.Resolver) (any, error) {
	if err := auth.ValidateUserOrAdmin(ctx, obj.(*models.User).ID); err != nil {
		return nil, err
	}

	return next(ctx)
}

func HasRoleDirective(ctx context.Context, obj any, next graphql.Resolver, role models.RoleEnum) (any, error) {
	if err := auth.ValidateRole(ctx, role); err != nil {
		return nil, err
	}

	return next(ctx)
}
