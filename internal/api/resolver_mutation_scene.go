package api

import (
	"context"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) SceneCreate(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	input.Fingerprints = filterMD5FingerprintEditInputs(input.Fingerprints)

	s := r.services.Scene()
	return s.Create(ctx, input)
}

func (r *mutationResolver) SceneUpdate(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	input.Fingerprints = filterMD5FingerprintEditInputs(input.Fingerprints)

	s := r.services.Scene()
	return s.Update(ctx, input)
}

func (r *mutationResolver) SceneDestroy(ctx context.Context, input models.SceneDestroyInput) (bool, error) {
	s := r.services.Scene()
	err := s.Delete(ctx, input.ID)
	return err == nil, err
}

func (r *mutationResolver) SubmitFingerprint(ctx context.Context, input models.FingerprintSubmission) (bool, error) {
	// Filter out MD5 fingerprints
	if input.Fingerprint != nil && input.Fingerprint.Algorithm == models.FingerprintAlgorithmMd5 {
		return true, nil
	}

	s := r.services.Scene()
	return s.SubmitFingerprint(ctx, input)
}

func (r *mutationResolver) SceneMoveFingerprintSubmissions(ctx context.Context, input models.MoveFingerprintSubmissionsInput) (bool, error) {
	s := r.services.Scene()
	err := s.MoveFingerprintSubmissions(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) SceneDeleteFingerprintSubmissions(ctx context.Context, input models.DeleteFingerprintSubmissionsInput) (bool, error) {
	s := r.services.Scene()
	err := s.DeleteFingerprintSubmissions(ctx, input)
	return err == nil, err
}
