package api

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/scene"
)

func (r *mutationResolver) SceneCreate(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var s *models.Scene
	if err := fac.WithTxn(func() error {
		var err error
		s, err = scene.Create(ctx, fac, input)
		return err
	}); err != nil {
		return nil, err
	}

	return s, nil
}

func (r *mutationResolver) SceneUpdate(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var s *models.Scene
	if err := fac.WithTxn(func() error {
		var err error
		s, err = scene.Update(ctx, fac, input)
		return err
	}); err != nil {
		return nil, err
	}

	return s, nil
}

func (r *mutationResolver) SceneDestroy(ctx context.Context, input models.SceneDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	var ret bool
	if err := fac.WithTxn(func() error {
		var err error
		ret, err = scene.Destroy(fac, input)
		return err
	}); err != nil {
		return false, err
	}

	return ret, nil
}

func (r *mutationResolver) SubmitFingerprint(ctx context.Context, input models.FingerprintSubmission) (bool, error) {
	fac := r.getRepoFactory(ctx)
	var ret bool
	if err := fac.WithTxn(func() error {
		var err error
		ret, err = scene.SubmitFingerprint(ctx, fac, input)
		return err
	}); err != nil {
		return false, err
	}

	return ret, nil
}
