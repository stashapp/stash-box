package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"

	"github.com/stashapp/stashdb/pkg/models"
)

type Resolver struct{}

func (r *Resolver) Mutation() models.MutationResolver {
	return &mutationResolver{r}
}
func (r *Resolver) Performer() models.PerformerResolver {
	return &performerResolver{r}
}
func (r *Resolver) Query() models.QueryResolver {
	return &queryResolver{r}
}

type mutationResolver struct{ *Resolver }

type queryResolver struct{ *Resolver }

func (r *queryResolver) Version(ctx context.Context) (*models.Version, error) {
	panic("not implemented")
}

// wasFieldIncluded returns true if the given field was included in the request.
// Slices are unmarshalled to empty slices even if the field was omitted. This
// method determines if it was omitted altogether.
func wasFieldIncluded(ctx context.Context, field string) bool {
	rctx := graphql.GetRequestContext(ctx)

	_, ret := rctx.Variables[field]
	return ret
}
