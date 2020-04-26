package api

import (
	"context"

	"github.com/stashapp/stashdb/pkg/models"
)

type Resolver struct{}

func (r *Resolver) Mutation() models.MutationResolver {
	return &mutationResolver{r}
}
func (r *Resolver) Performer() models.PerformerResolver {
	return &performerResolver{r}
}
func (r *Resolver) Tag() models.TagResolver {
	return &tagResolver{r}
}
func (r *Resolver) Image() models.ImageResolver {
	return &imageResolver{r}
}
func (r *Resolver) Studio() models.StudioResolver {
	return &studioResolver{r}
}
func (r *Resolver) Scene() models.SceneResolver {
	return &sceneResolver{r}
}
func (r *Resolver) User() models.UserResolver {
	return &userResolver{r}
}
func (r *Resolver) Query() models.QueryResolver {
	return &queryResolver{r}
}

type mutationResolver struct{ *Resolver }

type queryResolver struct{ *Resolver }

func (r *queryResolver) Version(ctx context.Context) (*models.Version, error) {
	panic("not implemented")
}
