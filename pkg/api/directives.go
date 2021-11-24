package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/pkg/models"
)

func isOwnerDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateUserOrAdmin(ctx, obj.(*models.User).ID); err != nil {
		return nil, err
	}

	return next(ctx)
}

func isAdminDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}
