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
	qb := models.NewSceneQueryBuilder()
	scene, err := qb.Create(newScene, tx)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	sceneAliases := models.CreateSceneChecksums(scene.ID, input.Checksums)
	if err := qb.CreateChecksums(sceneAliases, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// TODO - save the performers
	scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
	jqb := models.NewJoinsQueryBuilder()
	if err := jqb.CreatePerformersScenes(scenePerformers, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the tags
	tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

	if err := jqb.CreateScenesTags(tagJoins, tx); err != nil {
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

	qb := models.NewSceneQueryBuilder()

	// get the existing scene and modify it
	sceneID, _ := strconv.ParseInt(input.ID, 10, 64)
	updatedScene, err := qb.Find(sceneID)

	if err != nil {
		return nil, err
	}

	updatedScene.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Start the transaction and save the scene
	tx := database.DB.MustBeginTx(ctx, nil)

	// Populate scene from the input
	updatedScene.CopyFromUpdateInput(input)

	scene, err := qb.Update(*updatedScene, tx)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the checksums
	// TODO - only do this if provided
	sceneAliases := models.CreateSceneChecksums(scene.ID, input.Checksums)
	if err := qb.UpdateChecksums(scene.ID, sceneAliases, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// TODO - only do this if provided
	scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
	jqb := models.NewJoinsQueryBuilder()
	if err := jqb.UpdatePerformersScenes(scene.ID, scenePerformers, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the tags
	// TODO - only do this if provided
	tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

	if err := jqb.UpdateScenesTags(scene.ID, tagJoins, tx); err != nil {
		return nil, err
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

	qb := models.NewSceneQueryBuilder()
	tx := database.DB.MustBeginTx(ctx, nil)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	sceneID, err := strconv.ParseInt(input.ID, 10, 64)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(sceneID, tx); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
