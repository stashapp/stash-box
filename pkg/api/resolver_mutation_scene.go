package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/image"
	"github.com/stashapp/stashdb/pkg/models"
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

	var scene *models.Scene
	err = database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewSceneQueryBuilder(txn.GetTx())
		jqb := models.NewJoinsQueryBuilder(txn.GetTx())

		var err error
		scene, err = qb.Create(newScene)
		if err != nil {
			return err
		}

		// Save the checksums
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
		sceneUrls := models.CreateSceneUrls(scene.ID, input.Urls)
		if err := qb.CreateUrls(sceneUrls); err != nil {
			return err
		}

		// Save the tags
		tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

		if err := jqb.CreateScenesTags(tagJoins); err != nil {
			return err
		}

		// Save the images
		sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)

		if err := jqb.CreateScenesImages(sceneImages); err != nil {
			return err
		}

		return nil
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

	var scene *models.Scene
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewSceneQueryBuilder(txn.GetTx())
		jqb := models.NewJoinsQueryBuilder(txn.GetTx())
		iqb := models.NewImageQueryBuilder(txn.GetTx())

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
		sceneUrls := models.CreateSceneUrls(scene.ID, input.Urls)
		if err := qb.UpdateUrls(scene.ID, sceneUrls); err != nil {
			return err
		}

		// Save the images
		// get the existing images
		existingImages, err := iqb.FindBySceneID(scene.ID)

		sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)
		if err := jqb.UpdateScenesImages(scene.ID, sceneImages); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.Service{
			Repository: &iqb,
		}

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

	err = database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewSceneQueryBuilder(txn.GetTx())
		iqb := models.NewImageQueryBuilder(txn.GetTx())

		existingImages, err := iqb.FindBySceneID(sceneID)

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly
		if err = qb.Destroy(sceneID); err != nil {
			return err
		}

		// remove images that are no longer used
		imageService := image.Service{
			Repository: &iqb,
		}

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
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewSceneQueryBuilder(tx)

	// find the scene
	sceneID, _ := uuid.FromString(input.SceneID)
	scene, err := qb.Find(sceneID)

	if err != nil {
		return false, err
	}

	sceneFingerprint := models.CreateSceneFingerprints(scene.ID, []*models.FingerprintInput{input.Fingerprint})
	if err := qb.CreateFingerprints(sceneFingerprint); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return true, nil
}
