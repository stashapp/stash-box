package api

import (
	"context"

	"github.com/99designs/gqlgen/graphql"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type Resolver struct {
	getRepoFactory func(ctx context.Context) models.Repo
}

func NewResolver(repoFunc func(ctx context.Context) models.Repo) *Resolver {
	return &Resolver{
		getRepoFactory: repoFunc,
	}
}

func (r *Resolver) Mutation() models.MutationResolver {
	return &mutationResolver{r}
}
func (r *Resolver) Edit() models.EditResolver {
	return &editResolver{r}
}
func (r *Resolver) EditComment() models.EditCommentResolver {
	return &editCommentResolver{r}
}
func (r *Resolver) EditVote() models.EditVoteResolver {
	return &editVoteResolver{r}
}
func (r *Resolver) Performer() models.PerformerResolver {
	return &performerResolver{r}
}
func (r *Resolver) PerformerEdit() models.PerformerEditResolver {
	return &performerEditResolver{r}
}
func (r *Resolver) StudioEdit() models.StudioEditResolver {
	return &studioEditResolver{r}
}
func (r *Resolver) SceneEdit() models.SceneEditResolver {
	return &sceneEditResolver{r}
}
func (r *Resolver) Tag() models.TagResolver {
	return &tagResolver{r}
}
func (r *Resolver) TagCategory() models.TagCategoryResolver {
	return &tagCategoryResolver{r}
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
	version, githash, buildstamp := GetVersion()

	return &models.Version{
		Version:   version,
		Hash:      githash,
		BuildTime: buildstamp,
	}, nil
}

// wasFieldIncluded returns true if the given field was included in the request.
// Slices are unmarshalled to empty slices even if the field was omitted. This
// method determines if it was omitted altogether.
func wasFieldIncluded(ctx context.Context, qualifiedField string) bool {
	rctx := graphql.GetOperationContext(ctx)

	if rctx != nil {
		_, ret := utils.FindField(rctx.Variables, qualifiedField)
		return ret
	}

	return false
}

func wasFieldIncludedFunc(ctx context.Context) func(qualifiedField string) bool {
	return func(qualifiedField string) bool {
		return wasFieldIncluded(ctx, qualifiedField)
	}
}
