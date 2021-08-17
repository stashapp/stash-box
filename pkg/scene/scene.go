package scene

import (
	"context"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func Create(ctx context.Context, fac models.Repo, input models.SceneCreateInput) (*models.Scene, error) {
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
	qb := fac.Scene()
	jqb := fac.Joins()

	scene, err = qb.Create(newScene)
	if err != nil {
		return nil, err
	}

	// Save the checksums
	currentUserID := user.GetCurrentUser(ctx).ID
	for _, fp := range input.Fingerprints {
		if len(fp.UserIds) == 0 {
			// set the current user
			fp.UserIds = []string{currentUserID.String()}
		}
	}

	sceneFingerprints := models.CreateSceneFingerprints(scene.ID, input.Fingerprints)
	if err := qb.CreateFingerprints(sceneFingerprints); err != nil {
		return nil, err
	}

	// save the performers
	scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
	if err := jqb.CreatePerformersScenes(scenePerformers); err != nil {
		return nil, err
	}

	// Save the URLs
	sceneUrls := models.CreateSceneURLs(scene.ID, input.Urls)
	if err := qb.CreateURLs(sceneUrls); err != nil {
		return nil, err
	}

	// Save the tags
	tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)

	if err := jqb.CreateScenesTags(tagJoins); err != nil {
		return nil, err
	}

	// Save the images
	sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)

	if err := jqb.CreateScenesImages(sceneImages); err != nil {
		return nil, err
	}

	if err != nil {
		return nil, err
	}

	return scene, nil
}

func Update(ctx context.Context, fac models.Repo, input models.SceneUpdateInput) (*models.Scene, error) {
	qb := fac.Scene()
	jqb := fac.Joins()
	iqb := fac.Image()

	// get the existing scene and modify it
	sceneID, _ := uuid.FromString(input.ID)
	updatedScene, err := qb.Find(sceneID)

	if err != nil {
		return nil, err
	}

	updatedScene.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate scene from the input
	updatedScene.CopyFromUpdateInput(input)

	scene, err := qb.Update(*updatedScene)
	if err != nil {
		return nil, err
	}

	// TODO - handle the checksums
	// hashes present are kept
	// hashes missing are destroyed
	// new hashes are created and assigned to the current user

	// Save the checksums
	sceneFingerprints := models.CreateSceneFingerprints(scene.ID, input.Fingerprints)
	if err := qb.UpdateFingerprints(scene.ID, sceneFingerprints); err != nil {
		return nil, err
	}

	scenePerformers := models.CreateScenePerformers(scene.ID, input.Performers)
	if err := jqb.UpdatePerformersScenes(scene.ID, scenePerformers); err != nil {
		return nil, err
	}

	// Save the tags
	tagJoins := models.CreateSceneTags(scene.ID, input.TagIds)
	if err := jqb.UpdateScenesTags(scene.ID, tagJoins); err != nil {
		return nil, err
	}

	// Save the URLs
	sceneUrls := models.CreateSceneURLs(scene.ID, input.Urls)
	if err := qb.UpdateURLs(scene.ID, sceneUrls); err != nil {
		return nil, err
	}

	// Save the images
	// get the existing images
	existingImages, err := iqb.FindBySceneID(scene.ID)
	if err != nil {
		return nil, err
	}

	sceneImages := models.CreateSceneImages(scene.ID, input.ImageIds)
	if err := jqb.UpdateScenesImages(scene.ID, sceneImages); err != nil {
		return nil, err
	}

	// remove images that are no longer used
	imageService := image.GetService(iqb)

	for _, i := range existingImages {
		if err := imageService.DestroyUnusedImage(i.ID); err != nil {
			return nil, err
		}
	}

	return scene, nil
}

func Destroy(fac models.Repo, input models.SceneDestroyInput) (bool, error) {
	sceneID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}

	qb := fac.Scene()
	iqb := fac.Image()

	existingImages, err := iqb.FindBySceneID(sceneID)
	if err != nil {
		return false, err
	}

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly
	if err = qb.Destroy(sceneID); err != nil {
		return false, err
	}

	// remove images that are no longer used
	imageService := image.GetService(iqb)

	for _, i := range existingImages {
		if err := imageService.DestroyUnusedImage(i.ID); err != nil {
			return false, err
		}
	}

	return true, nil
}

func SubmitFingerprint(ctx context.Context, fac models.Repo, input models.FingerprintSubmission) (bool, error) {
	qb := fac.Scene()

	// find the scene
	sceneID, _ := uuid.FromString(input.SceneID)
	scene, err := qb.Find(sceneID)

	if err != nil {
		return false, err
	}

	// if no user is set, or if the current user does not have the modify
	// role, then set users to the current user
	if len(input.Fingerprint.UserIds) == 0 || !user.IsRole(ctx, models.RoleEnumModify) {
		currentUserID := user.GetCurrentUser(ctx).ID
		input.Fingerprint.UserIds = []string{currentUserID.String()}
	}

	sceneFingerprint := models.CreateSubmittedSceneFingerprints(scene.ID, []*models.FingerprintInput{input.Fingerprint})

	if input.Unmatch == nil || !*input.Unmatch {
		// set the new fingerprints
		if err := qb.CreateFingerprints(sceneFingerprint); err != nil {
			return false, err
		}
	} else {
		// remove fingerprints that match the user id, algorithm and hash
		if err := qb.DestroyFingerprints(sceneID, sceneFingerprint); err != nil {
			return false, err
		}
	}

	return true, nil
}
