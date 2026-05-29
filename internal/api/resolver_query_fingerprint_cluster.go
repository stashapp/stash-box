package api

import (
	"context"

	"github.com/vektah/gqlparser/v2/gqlerror"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

const (
	distanceMin       = 0
	distanceMax       = 16
	distanceModerator = 8
)

func (r *queryResolver) FingerprintClusters(ctx context.Context, input models.FingerprintClustersInput) (*models.FingerprintClustersResult, error) {
	if input.Distance < distanceMin || input.Distance > distanceMax {
		return nil, gqlerror.Errorf("distance must be between %d and %d", distanceMin, distanceMax)
	}
	if input.Distance > distanceModerator && !auth.IsRole(ctx, models.RoleEnumModerate) {
		return nil, gqlerror.Errorf("distance > %d is restricted to moderators", distanceModerator)
	}
	return r.services.Fingerprint().ClusterScenes(ctx, input.SceneID, input.Distance)
}
