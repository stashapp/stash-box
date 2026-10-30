package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) ImageTypeGroups(ctx context.Context, target *models.ImageTypeScopeEnum, includeDisabled *bool) ([]models.ImageTypeGroup, error) {
	return r.services.ImageType().Groups(ctx, target, includeDisabled != nil && *includeDisabled)
}
