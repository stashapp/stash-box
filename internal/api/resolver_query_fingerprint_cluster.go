package api

import (
	"context"

	"github.com/vektah/gqlparser/v2/gqlerror"

	"github.com/stashapp/stash-box/internal/models"
)

const distanceMin = 0
const distanceMax = 8

func (r *queryResolver) FingerprintClusters(ctx context.Context, input models.FingerprintClustersInput) ([]models.FingerprintCluster, error) {
	if input.Distance < distanceMin || input.Distance > distanceMax {
		return nil, gqlerror.Errorf("distance must be between %d and %d", distanceMin, distanceMax)
	}
	return r.services.Fingerprint().ClusterScenes(ctx, input.SceneID, input.Distance)
}
