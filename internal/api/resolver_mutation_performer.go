package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) PerformerCreate(ctx context.Context, input models.PerformerCreateInput) (*models.Performer, error) {
	return r.services.Performer().Create(ctx, input)
}

func (r *mutationResolver) PerformerUpdate(ctx context.Context, input models.PerformerUpdateInput) (*models.Performer, error) {
	return r.services.Performer().Update(ctx, input, r.services.Image())
}

func (r *mutationResolver) PerformerDestroy(ctx context.Context, input models.PerformerDestroyInput) (bool, error) {
	err := r.services.Performer().Delete(ctx, input.ID)

	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) FavoritePerformer(ctx context.Context, id uuid.UUID, favorite bool) (bool, error) {
	user := auth.GetCurrentUser(ctx)
	err := r.services.Performer().Favorite(ctx, user.ID, id, favorite)
	return err == nil, err
}
