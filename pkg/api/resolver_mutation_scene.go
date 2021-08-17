package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) SceneCreate(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new scene from the input
	currentTime := time.Now()
	newScene := models.Scene{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newScene.CopyFromCreateInput(input)
	fac := r.getRepoFactory(ctx)

	var scene *models.Scene
	err = fac.WithTxn(func() error {
		qb := fac.Scene()
		jqb := fac.Joins()

		var err error
		scene, err = qb.Create(newScene)
		if err != nil {
			return err
		}

		// Save the checksums
		currentUserID := getCurrentUser(ctx).ID
		for _, fp := range input.Fingerprints {
			if fp.UserIds == nil {
				// set the current user
				fp.UserIds = []string{currentUserID.String()}
			}
		}

		sceneFingerprints := models.CreateSceneFingerprints(scene.ID, input.Fingerprints)
		if err := qb.CreateFingerprints(sceneFingerprints); err != nil {
			return err
		}

		// save the performers
		scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
		if err := jqb.CreatePerformersScenes(scenePerformers); err != nil {
			return err
		}

		// Save the URLs
		sceneUrls := models.CreateSceneURLs(scene.ID, input.Urls)
		if err := qb.CreateURLs(sceneUrls); err != nil {
			return err
		}

		// Save the tags
		tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

		if err := jqb.CreateScenesTags(tagJoins); err != nil {
			return err
		}

		// Save the images
		sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)

		return jqb.CreateScenesImages(sceneImages)
	})

	if err != nil {
		return nil, err
	}

	return scene, nil
}

func (r *mutationResolver) SceneUpdate(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	fac := r.getRepoFactory(ctx)

	var scene *models.Scene
	err := fac.WithTxn(func() error {
		qb := fac.Scene()
		jqb := fac.Joins()
		iqb := fac.Image()

		// get the existing scene and modify it
		sceneID, _ := uuid.FromString(input.ID)
		updatedScene, err := qb.Find(sceneID)

		if err != nil {
			return err
		}

		updatedScene.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate scene from the input
		updatedScene.CopyFromUpdateInput(input)

		scene, err = qb.Update(*updatedScene)
		if err != nil {
			return err
		}

		// Save the checksums
		sceneFingerprints := models.CreateSceneFingerprints(scene.ID, input.Fingerprints)
		if err := qb.UpdateFingerprints(scene.ID, sceneFingerprints); err != nil {
			return err
		}

		scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
		if err := jqb.UpdatePerformersScenes(scene.ID, scenePerformers); err != nil {
			return err
		}

		// Save the tags
		tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)
		if err := jqb.UpdateScenesTags(scene.ID, tagJoins); err != nil {
			return err
		}

		// Save the URLs
		sceneUrls := models.CreateSceneURLs(scene.ID, input.Urls)
		if err := qb.UpdateURLs(scene.ID, sceneUrls); err != nil {
			return err
		}

		// Save the images
		// get the existing images
		existingImages, err := iqb.FindBySceneID(scene.ID)
		if err != nil {
			return err
		}

		sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)
		if err := jqb.UpdateScenesImages(scene.ID, sceneImages); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(iqb)

		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return scene, nil
}

func (r *mutationResolver) SceneDestroy(ctx context.Context, input models.SceneDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	sceneID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}

	fac := r.getRepoFactory(ctx)

	err = fac.WithTxn(func() error {
		qb := fac.Scene()
		iqb := fac.Image()

		existingImages, err := iqb.FindBySceneID(sceneID)
		if err != nil {
			return err
		}

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly
		if err = qb.Destroy(sceneID); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.GetService(iqb)

		for _, i := range existingImages {
			if err := imageService.DestroyUnusedImage(i.ID); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *mutationResolver) SubmitFingerprint(ctx context.Context, input models.FingerprintSubmission) (bool, error) {
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Scene()

		// find the scene
		sceneID, _ := uuid.FromString(input.SceneID)
		scene, err := qb.Find(sceneID)

		if err != nil {
			return err
		}

		// if no user is set, or if the current user does not have the modify
		// role, then set users to the current user
		if len(input.Fingerprint.UserIds) == 0 || !isRole(ctx, models.RoleEnumModify) {
			currentUserID := getCurrentUser(ctx).ID
			input.Fingerprint.UserIds = []string{currentUserID.String()}
		}

		sceneFingerprint := models.CreateSubmittedSceneFingerprints(scene.ID, []*models.FingerprintInput{input.Fingerprint})

		if input.Unmatch == nil || !*input.Unmatch {
			// set the new fingerprints
			if err := qb.CreateFingerprints(sceneFingerprint); err != nil {
				return err
			}
		} else {
			// remove fingerprints that match the user id, algorithm and hash
			if err := qb.DestroyFingerprints(sceneID, sceneFingerprint); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return false, err
	}

	return true, nil
}
