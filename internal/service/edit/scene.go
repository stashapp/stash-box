package edit

import (
	"context"
	"errors"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/pkg/utils"
)

type SceneEditProcessor struct {
	mutator
}

func Scene(ctx context.Context, queries *queries.Queries, edit *models.Edit) *SceneEditProcessor {
	return &SceneEditProcessor{
		mutator{
			context: ctx,
			queries: queries,
			edit:    edit,
		},
	}
}

func (m *SceneEditProcessor) Edit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery, update bool) error {
	if err := validateSceneEditInput(m.context, m.queries, input, m.edit, update); err != nil {
		return err
	}

	var err error
	switch input.Edit.Operation {
	case models.OperationEnumModify:
		err = m.modifyEdit(input, inputArgs)
	case models.OperationEnumMerge:
		err = m.mergeEdit(input, inputArgs)
	case models.OperationEnumDestroy:
		err = m.destroyEdit(input, inputArgs)
	case models.OperationEnumCreate:
		err = m.createEdit(input, inputArgs)
	}

	return err
}

func (m *SceneEditProcessor) modifyEdit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing scene
	sceneID := *input.Edit.ID
	dbScene, err := m.queries.FindScene(m.context, sceneID)

	if err != nil {
		return err
	}

	scene := converter.SceneToModel(dbScene)
	var entity editEntity = scene
	if err := validateEditEntity(&entity, sceneID, "scene"); err != nil {
		return err
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	sceneEdit, err := input.Details.SceneEditFromDiff(scene, detailArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(sceneEdit, sceneID, input, inputArgs); err != nil {
		return err
	}

	if reflect.DeepEqual(sceneEdit.Old, sceneEdit.New) {
		return ErrNoChanges
	}

	sceneEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*sceneEdit)
}

func (m *SceneEditProcessor) diffRelationships(sceneEdit *models.SceneEditData, sceneID uuid.UUID, input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	if input.Details.Urls != nil || inputArgs.Field("urls").IsNull() {
		if err := m.diffURLs(sceneEdit, sceneID, input.Details.Urls); err != nil {
			return err
		}
	}

	if input.Details.TagIds != nil || inputArgs.Field("tag_ids").IsNull() {
		if err := m.diffTags(sceneEdit, sceneID, input.Details.TagIds); err != nil {
			return err
		}
	}

	if input.Details.ImageIds != nil || inputArgs.Field("image_ids").IsNull() {
		if err := m.diffImages(sceneEdit, sceneID, input.Details.ImageIds); err != nil {
			return err
		}
	}

	if input.Details.Performers != nil || inputArgs.Field("performers").IsNull() {
		if err := m.diffPerformers(sceneEdit, sceneID, input.Details.Performers); err != nil {
			return err
		}
	}

	return nil
}

func (m *SceneEditProcessor) diffTags(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newImageIds []uuid.UUID) error {
	tags, err := m.queries.FindTagsBySceneID(m.context, sceneID)
	if err != nil {
		return err
	}

	var existingTags []uuid.UUID
	for _, tag := range tags {
		existingTags = append(existingTags, tag.ID)
	}
	sceneEdit.New.AddedTags, sceneEdit.New.RemovedTags = utils.SliceCompare(newImageIds, existingTags)
	return nil
}

func (m *SceneEditProcessor) diffURLs(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newURLs []models.URL) error {
	dbUrls, err := m.queries.GetSceneURLs(m.context, sceneID)
	if err != nil {
		return err
	}

	var urls []models.URL
	for _, url := range dbUrls {
		urls = append(urls, models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	sceneEdit.New.AddedUrls, sceneEdit.New.RemovedUrls = urlCompare(newURLs, urls)
	return nil
}

func (m *SceneEditProcessor) diffPerformers(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newPerformers []models.PerformerAppearanceInput) error {
	existingPerformers, err := m.queries.GetScenePerformers(m.context, sceneID)
	if err != nil {
		return err
	}

	sceneEdit.New.AddedPerformers, sceneEdit.New.RemovedPerformers = performerAppearanceCompare(newPerformers, existingPerformers)
	return nil
}

func performerAppearanceCompare(subject []models.PerformerAppearanceInput, against []queries.GetScenePerformersRow) (added []models.PerformerAppearanceInput, missing []models.PerformerAppearanceInput) {
	eq := func(s models.PerformerAppearanceInput, a queries.GetScenePerformersRow) bool {
		if s.PerformerID == a.Performer.ID {
			sAs := ""
			if s.As != nil {
				sAs = *s.As
			}

			aAs := ""
			if a.As != nil {
				aAs = *a.As
			}

			return sAs == aAs
		}

		return false
	}

	eqI := func(s, a models.PerformerAppearanceInput) bool {
		if s.PerformerID == a.PerformerID {
			if s.As == a.As {
				return true
			}

			if s.As == nil || a.As == nil {
				return false
			}

			return *s.As == *a.As
		}

		return false
	}

	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if eq(s, a) {
				newMod = false
			}
		}

		for _, a := range added {
			if eqI(s, a) {
				newMod = false
			}
		}

		if newMod {
			added = append(added, s)
		}
	}

	for _, s := range against {
		removedMod := true
		for _, a := range subject {
			if eq(a, s) {
				removedMod = false
			}
		}

		for _, a := range missing {
			if eq(a, s) {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, models.PerformerAppearanceInput{
				PerformerID: s.Performer.ID,
				As:          s.As,
			})
		}
	}
	return
}

func (m *SceneEditProcessor) diffImages(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newImageIds []uuid.UUID) error {
	images, err := m.queries.FindImagesBySceneID(m.context, sceneID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	sceneEdit.New.AddedImages, sceneEdit.New.RemovedImages = utils.SliceCompare(newImageIds, existingImages)
	return nil
}

func (m *SceneEditProcessor) mergeEdit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing scene
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}

	sceneID := *input.Edit.ID
	dbScene, err := m.queries.FindScene(m.context, sceneID)

	if err != nil {
		return fmt.Errorf("%w: target scene, %s: %w", ErrEntityNotFound, sceneID.String(), err)
	}

	scene := converter.SceneToModel(dbScene)
	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		_, err := m.queries.FindScene(m.context, sourceID)
		if err != nil {
			return fmt.Errorf("%w: source scene, %s: %w", ErrEntityNotFound, sourceID.String(), err)
		}

		if sceneID == sourceID {
			return ErrMergeTargetIsSource
		}
		mergeSources = append(mergeSources, sourceID)
	}

	if len(mergeSources) < 1 {
		return ErrNoMergeSources
	}

	// perform a diff against the input and the current object
	detailArgs := inputArgs.Field("details")
	sceneEdit, err := input.Details.SceneEditFromMerge(scene, mergeSources, detailArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(sceneEdit, sceneID, input, inputArgs); err != nil {
		return err
	}

	return m.edit.SetData(*sceneEdit)
}

func (m *SceneEditProcessor) createEdit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	sceneEdit, err := input.Details.SceneEditFromCreate(inputArgs)
	if err != nil {
		return err
	}

	sceneEdit.New.AddedUrls = input.Details.Urls
	sceneEdit.New.AddedTags = input.Details.TagIds
	sceneEdit.New.AddedImages = input.Details.ImageIds
	sceneEdit.New.AddedPerformers = input.Details.Performers
	sceneEdit.New.AddedFingerprints = input.Details.Fingerprints
	sceneEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*sceneEdit)
}

func (m *SceneEditProcessor) destroyEdit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	// get the existing scene
	sceneID := *input.Edit.ID
	dbScene, err := m.queries.FindScene(m.context, sceneID)
	if err != nil {
		return err
	}

	var entity editEntity = converter.SceneToModel(dbScene)
	return validateEditEntity(&entity, sceneID, "scene")
}

func (m *SceneEditProcessor) CreateJoin(input models.SceneEditInput) error {
	if input.Edit.ID != nil {
		return m.queries.CreateSceneEdit(m.context, queries.CreateSceneEditParams{
			EditID:  m.edit.ID,
			SceneID: *input.Edit.ID,
		})
	}

	return nil
}

func (m *SceneEditProcessor) apply() error {
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var scene *models.Scene
	if !isCreate {
		res, err := m.queries.GetEditTargetID(m.context, m.edit.ID)
		if err != nil {
			return err
		}
		dbScene, err := m.queries.FindScene(m.context, res.ID)
		if err != nil {
			return fmt.Errorf("%w: scene, %s: %w", ErrEntityNotFound, res.ID.String(), err)
		}

		scene = converter.SceneToModelPtr(dbScene)
	}

	return m.applyEdit(scene)
}

func (m *SceneEditProcessor) applyEdit(scene *models.Scene) error {
	data, err := m.edit.GetSceneData()
	if err != nil {
		return err
	}

	operation := m.operation()

	switch operation {
	case models.OperationEnumCreate:
		var userID *uuid.UUID
		if m.edit.UserID.Valid {
			userID = &m.edit.UserID.UUID
		}
		return m.applyCreate(data, userID)
	case models.OperationEnumDestroy:
		return m.applyDestroy(scene)
	case models.OperationEnumModify:
		return m.applyModify(scene, data)
	case models.OperationEnumMerge:
		return m.applyMerge(scene, data)
	}
	return nil
}

func (m *SceneEditProcessor) applyCreate(data *models.SceneEditData, userID *uuid.UUID) error {
	UUID := data.New.DraftID
	if UUID == nil {
		newUUID, err := uuid.NewV7()
		if err != nil {
			return err
		}
		UUID = &newUUID
	}
	newScene := &models.Scene{
		ID: *UUID,
	}

	if err := m.ApplyEdit(newScene, true, data, userID); err != nil {
		return err
	}

	return m.queries.CreateSceneEdit(m.context, queries.CreateSceneEditParams{
		EditID:  m.edit.ID,
		SceneID: newScene.ID,
	})
}

func (m *SceneEditProcessor) applyModify(scene *models.Scene, data *models.SceneEditData) error {
	if err := scene.ValidateModifyEdit(*data); err != nil {
		return err
	}

	return m.ApplyEdit(scene, false, data, nil)
}

func (m *SceneEditProcessor) applyDestroy(scene *models.Scene) error {
	_, err := m.queries.SoftDeleteScene(m.context, scene.ID)
	if err != nil {
		return err
	}

	// delete relationships
	if err = m.queries.DeleteSceneTagsByScene(m.context, scene.ID); err != nil {
		return err
	}

	if err = m.queries.DeleteScenePerformers(m.context, scene.ID); err != nil {
		return err
	}

	return err
}

func (m *SceneEditProcessor) applyMerge(scene *models.Scene, data *models.SceneEditData) error {
	if err := m.applyModify(scene, data); err != nil {
		return err
	}

	for _, sourceID := range data.MergeSources {
		if err := m.mergeInto(sourceID, scene.ID); err != nil {
			return err
		}
	}

	return nil
}

func (m *SceneEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	scene, err := m.queries.FindScene(m.context, sourceID)
	if err != nil {
		return fmt.Errorf("%w: source scene, %s: %w", ErrEntityNotFound, sourceID.String(), err)
	}

	target, err := m.queries.FindScene(m.context, targetID)
	if err != nil {
		return fmt.Errorf("%w: target scene, %s: %w", ErrEntityNotFound, targetID.String(), err)
	}

	return m.MergeInto(scene, target)
}

func (m *SceneEditProcessor) ApplyEdit(scene *models.Scene, create bool, data *models.SceneEditData, userID *uuid.UUID) error {
	old := data.Old
	if old == nil {
		old = &models.SceneEdit{}
	}
	scene.CopyFromSceneEdit(*data.New, old)

	var err error
	if create {
		newScene := converter.SceneToCreateParams(*scene)
		_, err = m.queries.CreateScene(m.context, newScene)
	} else {
		updateScene := converter.SceneToUpdateParams(*scene)
		_, err = m.queries.UpdateScene(m.context, updateScene)
	}
	if err != nil {
		return err
	}

	if err := m.updateURLsFromEdit(scene, data); err != nil {
		return err
	}

	if err := m.updateImagesFromEdit(scene, data); err != nil {
		return err
	}

	if err := m.updateTagsFromEdit(scene, data); err != nil {
		return err
	}

	if err := m.updatePerformersFromEdit(scene, data); err != nil {
		return err
	}

	if create && len(data.New.AddedFingerprints) > 0 && userID != nil {
		if err := m.addFingerprintsFromEdit(scene, data, *userID); err != nil {
			return err
		}
	}

	return err
}

func (m *SceneEditProcessor) updateURLsFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	urls, err := m.queries.GetMergedURLsForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteSceneURLs(m.context, scene.ID); err != nil {
		return err
	}

	var urlsParams []queries.CreateSceneURLsParams
	for _, url := range urls {
		urlsParams = append(urlsParams, queries.CreateSceneURLsParams{
			SceneID: scene.ID,
			Url:     url.Url,
			SiteID:  url.SiteID,
		})
	}

	_, err = m.queries.CreateSceneURLs(m.context, urlsParams)
	return err
}

func (m *SceneEditProcessor) updateImagesFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	images, err := m.queries.GetImagesForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteSceneImages(m.context, scene.ID); err != nil {
		return err
	}

	var sceneImages []queries.CreateSceneImagesParams
	for _, image := range images {
		sceneImages = append(sceneImages, queries.CreateSceneImagesParams{
			ImageID: image.ID,
			SceneID: scene.ID,
		})
	}
	_, err = m.queries.CreateSceneImages(m.context, sceneImages)
	return err
}

func (m *SceneEditProcessor) updateTagsFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	tags, err := m.queries.GetMergedTagsForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteSceneTagsByScene(m.context, scene.ID); err != nil {
		return nil
	}

	var sceneTags []queries.CreateSceneTagsParams
	for _, tag := range tags {
		sceneTags = append(sceneTags, queries.CreateSceneTagsParams{
			TagID:   tag.ID,
			SceneID: scene.ID,
		})
	}
	_, err = m.queries.CreateSceneTags(m.context, sceneTags)
	return err
}

func (m *SceneEditProcessor) updatePerformersFromEdit(scene *models.Scene, data *models.SceneEditData) error {
	appearances, err := m.queries.GetMergedPerformersForEdit(m.context, m.edit.ID)
	if err != nil {
		return err
	}

	if err := m.queries.DeleteScenePerformers(m.context, scene.ID); err != nil {
		return err
	}

	var scenePerformers []queries.CreateScenePerformersParams
	for _, appearance := range appearances {
		scenePerformers = append(scenePerformers, queries.CreateScenePerformersParams{
			PerformerID: appearance.Performer.ID,
			As:          appearance.As,
			SceneID:     scene.ID,
		})
	}
	_, err = m.queries.CreateScenePerformers(m.context, scenePerformers)
	return err
}

func (m *SceneEditProcessor) addFingerprintsFromEdit(scene *models.Scene, data *models.SceneEditData, userID uuid.UUID) error {
	var params []queries.CreateSceneFingerprintsParams
	for _, fingerprint := range data.New.AddedFingerprints {
		if fingerprint.Duration > 0 {
			id, err := m.getOrCreateFingerprintID(fingerprint.Hash, fingerprint.Algorithm.String())
			if err != nil {
				return err
			}
			params = append(params, queries.CreateSceneFingerprintsParams{
				FingerprintID: int(id),
				SceneID:       scene.ID,
				UserID:        userID,
				Duration:      fingerprint.Duration,
			})
		}
	}

	if len(params) > 0 {
		_, err := m.queries.CreateSceneFingerprints(m.context, params)
		return err
	}
	return nil
}

func (m *SceneEditProcessor) getOrCreateFingerprintID(hash models.FingerprintHash, algorithm string) (int, error) {
	fp, err := m.queries.GetFingerprint(m.context, queries.GetFingerprintParams{
		Hash:      hash.Int64(),
		Algorithm: algorithm,
	})
	if err == nil {
		return fp.ID, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return 0, err
	}

	newFp, err := m.queries.CreateFingerprint(m.context, queries.CreateFingerprintParams{
		Hash:      hash.Int64(),
		Algorithm: algorithm,
	})
	if err != nil {
		return 0, err
	}
	return newFp.ID, nil
}

func (m *SceneEditProcessor) MergeInto(source queries.Scene, target queries.Scene) error {
	if source.Deleted {
		return fmt.Errorf("merge source scene is deleted: %s", source.ID.String())
	}
	if target.Deleted {
		return fmt.Errorf("merge target scene is deleted: %s", target.ID.String())
	}

	if _, err := m.queries.SoftDeleteScene(m.context, source.ID); err != nil {
		return err
	}

	if err := m.queries.UpdateSceneRedirects(m.context, queries.UpdateSceneRedirectsParams{
		OldTargetID: source.ID,
		NewTargetID: target.ID,
	}); err != nil {
		return err
	}

	return m.queries.CreateSceneRedirect(m.context, queries.CreateSceneRedirectParams{
		SourceID: source.ID,
		TargetID: target.ID,
	})
}
