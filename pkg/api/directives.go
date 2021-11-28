package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"
	"github.com/stashapp/stash-box/pkg/models"
)

func IsOwnerDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateUserOrAdmin(ctx, obj.(*models.User).ID); err != nil {
		return nil, err
	}

	return next(ctx)
}

func IsAdminDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}

func IsModifyDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}

func IsReadDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateRead(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}

func IsEditDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateEdit(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}

func IsVoteDirective(ctx context.Context, obj interface{}, next graphql.Resolver) (interface{}, error) {
	if err := validateVote(ctx); err != nil {
		return nil, err
	}

	return next(ctx)
}
