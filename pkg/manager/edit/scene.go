package edit

import (
	"fmt"
	"reflect"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type SceneEditProcessor struct {
	mutator
}

func Scene(fac models.Repo, edit *models.Edit) *SceneEditProcessor {
	return &SceneEditProcessor{
		mutator{
			fac:  fac,
			edit: edit,
		},
	}
}

func (m *SceneEditProcessor) Edit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
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
	sqb := m.fac.Scene()

	// get the existing scene
	sceneID := *input.Edit.ID
	scene, err := sqb.Find(sceneID)

	if err != nil {
		return err
	}

	if scene == nil {
		return fmt.Errorf("%w: scene %s", ErrEntityNotFound, sceneID.String())
	}

	// perform a diff against the input and the current object
	sceneEdit, err := input.Details.SceneEditFromDiff(*scene, inputArgs)
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
	tqb := m.fac.Tag()
	tags, err := tqb.FindBySceneID(sceneID)
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

func (m *SceneEditProcessor) diffURLs(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newURLs []*models.URLInput) error {
	sqb := m.fac.Scene()
	urls, err := sqb.GetURLs(sceneID)
	if err != nil {
		return err
	}
	sceneEdit.New.AddedUrls, sceneEdit.New.RemovedUrls = urlCompare(newURLs, urls)
	return nil
}

func (m *SceneEditProcessor) diffPerformers(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newPerformers []*models.PerformerAppearanceInput) error {
	sqb := m.fac.Scene()

	existingPerformers, err := sqb.GetPerformers(sceneID)
	if err != nil {
		return err
	}

	sceneEdit.New.AddedPerformers, sceneEdit.New.RemovedPerformers = performerAppearanceCompare(newPerformers, existingPerformers)
	return nil
}

func performerAppearanceCompare(subject []*models.PerformerAppearanceInput, against models.PerformersScenes) (added []*models.PerformerAppearanceInput, missing []*models.PerformerAppearanceInput) {
	eq := func(s *models.PerformerAppearanceInput, a *models.PerformerScene) bool {
		if s.PerformerID == a.PerformerID {
			sAs := ""
			if s.As != nil {
				sAs = *s.As
			}
			return sAs == a.As.String
		}

		return false
	}

	eqI := func(s, a *models.PerformerAppearanceInput) bool {
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
			var as *string
			if s.As.Valid {
				as = &s.As.String
			}

			missing = append(missing, &models.PerformerAppearanceInput{
				PerformerID: s.PerformerID,
				As:          as,
			})
		}
	}
	return
}

func (m *SceneEditProcessor) diffImages(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newImageIds []uuid.UUID) error {
	iqb := m.fac.Image()
	images, err := iqb.FindBySceneID(sceneID)
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
	sqb := m.fac.Scene()

	// get the existing scene
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}

	sceneID := *input.Edit.ID
	scene, err := sqb.Find(sceneID)

	if err != nil {
		return err
	}

	if scene == nil {
		return fmt.Errorf("%w: target scene %s", ErrEntityNotFound, sceneID.String())
	}

	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		sourceScene, err := sqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourceScene == nil {
			return fmt.Errorf("%w: source scene %s", ErrEntityNotFound, sourceID.String())
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
	sceneEdit, err := input.Details.SceneEditFromMerge(*scene, mergeSources, inputArgs)
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

	sceneEdit.New.AddedUrls = models.ParseURLInput(input.Details.Urls)
	sceneEdit.New.AddedTags = input.Details.TagIds
	sceneEdit.New.AddedImages = input.Details.ImageIds
	sceneEdit.New.AddedPerformers = input.Details.Performers
	sceneEdit.New.AddedFingerprints = input.Details.Fingerprints
	sceneEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*sceneEdit)
}

func (m *SceneEditProcessor) destroyEdit(input models.SceneEditInput, inputArgs utils.ArgumentsQuery) error {
	tqb := m.fac.Scene()

	// get the existing scene
	scene, err := tqb.Find(*input.Edit.ID)
	if scene == nil {
		return fmt.Errorf("scene with id %v not found", *input.Edit.ID)
	}

	return err
}

func (m *SceneEditProcessor) CreateJoin(input models.SceneEditInput) error {
	if input.Edit.ID != nil {
		editScene := models.EditScene{
			EditID:  m.edit.ID,
			SceneID: *input.Edit.ID,
		}

		return m.fac.Edit().CreateEditScene(editScene)
	}

	return nil
}

func (m *SceneEditProcessor) apply() error {
	sqb := m.fac.Scene()
	eqb := m.fac.Edit()
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var scene *models.Scene
	if !isCreate {
		sceneID, err := eqb.FindSceneID(m.edit.ID)
		if err != nil {
			return err
		}
		scene, err = sqb.Find(*sceneID)
		if err != nil {
			return err
		}
		if scene == nil {
			return fmt.Errorf("%w: scene %s", ErrEntityNotFound, sceneID.String())
		}

		scene.UpdatedAt = time.Now()
	}

	newScene, err := m.applyEdit(scene)
	if err != nil {
		return err
	}

	if isCreate {
		editScene := models.EditScene{
			EditID:  m.edit.ID,
			SceneID: newScene.ID,
		}

		err = eqb.CreateEditScene(editScene)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *SceneEditProcessor) applyEdit(scene *models.Scene) (*models.Scene, error) {
	data, err := m.edit.GetSceneData()
	if err != nil {
		return nil, err
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
	return nil, nil
}

func (m *SceneEditProcessor) applyCreate(data *models.SceneEditData, userID *uuid.UUID) (*models.Scene, error) {
	now := time.Now()
	UUID := data.New.DraftID
	if UUID == nil {
		newUUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}
		UUID = &newUUID
	}
	newScene := &models.Scene{
		ID:        *UUID,
		CreatedAt: now,
		UpdatedAt: now,
	}

	qb := m.fac.Scene()

	const create = true
	return qb.ApplyEdit(newScene, create, data, userID)
}

func (m *SceneEditProcessor) applyModify(scene *models.Scene, data *models.SceneEditData) (*models.Scene, error) {
	if err := scene.ValidateModifyEdit(*data); err != nil {
		return nil, err
	}

	qb := m.fac.Scene()
	const create = false
	return qb.ApplyEdit(scene, create, data, nil)
}

func (m *SceneEditProcessor) applyDestroy(scene *models.Scene) (*models.Scene, error) {
	qb := m.fac.Scene()
	updatedScene, err := qb.SoftDelete(*scene)
	if err != nil {
		return nil, err
	}

	// delete relationships
	jqb := m.fac.Joins()
	if err := jqb.DestroyScenesTags(scene.ID); err != nil {
		return nil, err
	}

	if err := jqb.DestroyPerformersScenes(scene.ID); err != nil {
		return nil, err
	}

	return updatedScene, err
}

func (m *SceneEditProcessor) applyMerge(scene *models.Scene, data *models.SceneEditData) (*models.Scene, error) {
	updatedScene, err := m.applyModify(scene, data)
	if err != nil {
		return nil, err
	}

	for _, sourceID := range data.MergeSources {
		if err := m.mergeInto(sourceID, scene.ID); err != nil {
			return nil, err
		}
	}

	return updatedScene, nil
}

func (m *SceneEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID) error {
	qb := m.fac.Scene()
	scene, err := qb.Find(sourceID)
	if err != nil {
		return err
	}
	if scene == nil {
		return fmt.Errorf("%w: source scene %s", ErrEntityNotFound, sourceID.String())
	}

	target, err := qb.Find(targetID)
	if err != nil {
		return err
	}
	if target == nil {
		return fmt.Errorf("%w: target scene %s", ErrEntityNotFound, targetID.String())
	}

	return qb.MergeInto(scene, target)
}
