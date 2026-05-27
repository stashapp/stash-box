package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

type clusterSceneSubmissionResolver struct{ *Resolver }

func (r *clusterSceneSubmissionResolver) Scene(ctx context.Context, obj *models.ClusterSceneSubmission) (*models.Scene, error) {
	return dataloader.For(ctx).SceneByID.Load(obj.SceneID)
}

type clusterOshashResolver struct{ *Resolver }

func (r *clusterOshashResolver) Scene(ctx context.Context, obj *models.ClusterOshash) (*models.Scene, error) {
	return dataloader.For(ctx).SceneByID.Load(obj.SceneID)
}
