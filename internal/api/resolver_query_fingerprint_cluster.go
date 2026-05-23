package api

import (
	"context"
	"errors"

	"github.com/vektah/gqlparser/v2/gqlerror"

	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/service/fingerprint"
)

const distanceMin = 0
const distanceMax = 8

func (r *queryResolver) FingerprintClusters(ctx context.Context, input models.FingerprintClustersInput) ([]models.FingerprintCluster, error) {
	if input.Distance < distanceMin || input.Distance > distanceMax {
		return nil, gqlerror.Errorf("distance must be between %d and %d", distanceMin, distanceMax)
	}
	clusters, err := r.services.Fingerprint().ClusterScenes(ctx, input.SceneID, input.Distance)
	if err != nil {
		if errors.Is(err, fingerprint.ErrBktreeRequired) {
			return nil, &gqlerror.Error{
				Message: err.Error(),
				Extensions: map[string]interface{}{
					"code": "BKTREE_REQUIRED",
				},
			}
		}
		return nil, err
	}
	return clusters, nil
}

func (r *queryResolver) DefaultPhashDistance(ctx context.Context) (int, error) {
	return config.GetPHashDistance(), nil
}
