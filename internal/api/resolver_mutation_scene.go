package api

import (
	"context"
	"errors"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SceneCreate(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	s := r.services.Scene()
	return s.Create(ctx, input)
}

func (r *mutationResolver) SceneUpdate(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	s := r.services.Scene()
	return s.Update(ctx, input)
}

func (r *mutationResolver) SceneDestroy(ctx context.Context, input models.SceneDestroyInput) (bool, error) {
	s := r.services.Scene()
	err := s.Delete(ctx, input.ID)
	return err == nil, err
}

func (r *mutationResolver) SubmitFingerprint(ctx context.Context, input models.FingerprintSubmission) (bool, error) {
	s := r.services.Scene()
	return s.SubmitFingerprint(ctx, input)
}

func (r *mutationResolver) SubmitFingerprints(ctx context.Context, input []models.FingerprintBatchSubmission) ([]models.FingerprintSubmissionResult, error) {
	// Validate max 1000 fingerprints
	if len(input) > 1000 {
		return nil, errors.New("maximum of 1000 fingerprints allowed per batch")
	}

	s := r.services.Scene()
	return s.SubmitFingerprints(ctx, input)
}
