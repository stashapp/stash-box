package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
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
func (r *Resolver) TagEdit() models.TagEditResolver {
	return &tagEditResolver{r}
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
func (r *Resolver) Site() models.SiteResolver {
	return &siteResolver{r}
}
func (r *Resolver) URL() models.URLResolver {
	return &urlResolver{r}
}
func (r *Resolver) User() models.UserResolver {
	return &userResolver{r}
}
func (r *Resolver) Query() models.QueryResolver {
	return &queryResolver{r}
}
func (r *Resolver) QueryPerformersResultType() models.QueryPerformersResultTypeResolver {
	return &queryPerformerResolver{r}
}
func (r *Resolver) QueryScenesResultType() models.QueryScenesResultTypeResolver {
	return &querySceneResolver{r}
}
func (r *Resolver) QueryEditsResultType() models.QueryEditsResultTypeResolver {
	return &queryEditResolver{r}
}
func (r *Resolver) Draft() models.DraftResolver {
	return &draftResolver{r}
}
func (r *Resolver) PerformerDraft() models.PerformerDraftResolver {
	return &performerDraftResolver{r}
}
func (r *Resolver) SceneDraft() models.SceneDraftResolver {
	return &sceneDraftResolver{r}
}
func (r *Resolver) QueryExistingSceneResult() models.QueryExistingSceneResultResolver {
	return &queryExistingSceneResolver{r}
}
func (r *Resolver) QueryExistingPerformerResult() models.QueryExistingPerformerResultResolver {
	return &queryExistingPerformerResolver{r}
}
func (r *Resolver) QueryNotificationsResult() models.QueryNotificationsResultResolver {
	return &queryNotificationsResolver{r}
}
func (r *Resolver) Notification() models.NotificationResolver {
	return &notificationResolver{r}
}

type mutationResolver struct{ *Resolver }

type queryResolver struct{ *Resolver }

func (r *queryResolver) Version(ctx context.Context) (*models.Version, error) {
	version, githash, buildstamp := GetVersion()

	return &models.Version{
		Version:   version,
		Hash:      githash,
		BuildTime: buildstamp,
		BuildType: buildtype,
	}, nil
}

func (r *queryResolver) GetConfig(ctx context.Context) (*models.StashBoxConfig, error) {
	return &models.StashBoxConfig{
		HostURL:                    config.GetHostURL(),
		RequireInvite:              config.GetRequireInvite(),
		RequireActivation:          config.GetRequireActivation(),
		VotePromotionThreshold:     config.GetVotePromotionThreshold(),
		VoteApplicationThreshold:   config.GetVoteApplicationThreshold(),
		VotingPeriod:               config.GetVotingPeriod(),
		MinDestructiveVotingPeriod: config.GetMinDestructiveVotingPeriod(),
		VoteCronInterval:           config.GetVoteCronInterval(),
		GuidelinesURL:              config.GetGuidelinesURL(),
		RequireSceneDraft:          config.GetRequireSceneDraft(),
		EditUpdateLimit:            config.GetEditUpdateLimit(),
	}, nil
}
