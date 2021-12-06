package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func IsUserOwnerDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateUserOrAdmin(ctx, obj.(*models.User).ID); err != nil {
		return nil, err
	}

	return next(ctx)
}

func HasRoleDirective(ctx context.Context, obj interface{}, next graphql.Resolver, role models.RoleEnum) (interface{}, error) {
	if err := user.ValidateRole(ctx, role); err != nil {
		return nil, err
	}

	return next(ctx)
}
