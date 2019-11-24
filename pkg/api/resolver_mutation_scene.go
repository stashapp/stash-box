package api

import (
	"context"
	"strconv"
	"time"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) SceneCreate(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var err error

	if err != nil {
		return nil, err
	}

	// Populate a new scene from the input
	currentTime := time.Now()
	newScene := models.Scene{
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newScene.CopyFromCreateInput(input)

	// Start the transaction and save the scene
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewSceneQueryBuilder(tx)
	scene, err := qb.Create(newScene)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the checksums
	sceneAliases := models.CreateSceneChecksums(scene.ID, input.Checksums)
	if err := qb.CreateChecksums(sceneAliases); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// save the performers
	scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
	jqb := models.NewJoinsQueryBuilder(tx)
	if err := jqb.CreatePerformersScenes(scenePerformers); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the tags
	tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

	if err := jqb.CreateScenesTags(tagJoins); err != nil {
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return scene, nil
}

func (r *mutationResolver) SceneUpdate(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewSceneQueryBuilder(tx)

	// get the existing scene and modify it
	sceneID, _ := strconv.ParseInt(input.ID, 10, 64)
	updatedScene, err := qb.Find(sceneID)

	if err != nil {
		return nil, err
	}

	updatedScene.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate scene from the input
	updatedScene.CopyFromUpdateInput(input)

	scene, err := qb.Update(*updatedScene)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the checksums
	// only do this if provided
	if wasFieldIncluded(ctx, "checksums") {
		sceneChecksums := models.CreateSceneChecksums(scene.ID, input.Checksums)
		if err := qb.UpdateChecksums(scene.ID, sceneChecksums); err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	}

	jqb := models.NewJoinsQueryBuilder(tx)

	// only do this if provided
	if wasFieldIncluded(ctx, "performers") {
		scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
		if err := jqb.UpdatePerformersScenes(scene.ID, scenePerformers); err != nil {
			_ = tx.Rollback()
			return nil, err
		}
	}

	// Save the tags
	// only do this if provided
	if wasFieldIncluded(ctx, "tagIds") {
		tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

		if err := jqb.UpdateScenesTags(scene.ID, tagJoins); err != nil {
			return nil, err
		}
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return scene, nil
}

func (r *mutationResolver) SceneDestroy(ctx context.Context, input models.SceneDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewSceneQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	sceneID, err := strconv.ParseInt(input.ID, 10, 64)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(sceneID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
