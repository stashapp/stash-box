package edit

import (
	"errors"
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

func (m *SceneEditProcessor) Edit(input models.SceneEditInput, inputSpecified InputSpecifiedFunc) error {
	var err error
	switch input.Edit.Operation {
	case models.OperationEnumModify:
		err = m.modifyEdit(input, inputSpecified)
	case models.OperationEnumMerge:
		err = m.mergeEdit(input, inputSpecified)
	case models.OperationEnumDestroy:
		err = m.destroyEdit(input, inputSpecified)
	case models.OperationEnumCreate:
		err = m.createEdit(input, inputSpecified)
	default:
		panic("not implemented")
	}

	return err
}

func (m *SceneEditProcessor) modifyEdit(input models.SceneEditInput, inputSpecified InputSpecifiedFunc) error {
	sqb := m.fac.Scene()

	// get the existing scene
	sceneID, _ := uuid.FromString(*input.Edit.ID)
	scene, err := sqb.Find(sceneID)

	if err != nil {
		return err
	}

	if scene == nil {
		return errors.New("scene with id " + sceneID.String() + " not found")
	}

	// perform a diff against the input and the current object
	sceneEdit := input.Details.SceneEditFromDiff(*scene)

	if err := m.diffRelationships(&sceneEdit, sceneID, input); err != nil {
		return err
	}

	if reflect.DeepEqual(sceneEdit.Old, sceneEdit.New) {
		return errors.New("edit contains no changes")
	}

	return m.edit.SetData(sceneEdit)
}

func (m *SceneEditProcessor) diffRelationships(sceneEdit *models.SceneEditData, sceneID uuid.UUID, input models.SceneEditInput) error {
	if err := m.diffURLs(sceneEdit, sceneID, input.Details.Urls); err != nil {
		return err
	}

	if err := m.diffFingerprints(sceneEdit, sceneID, input.Details.Fingerprints); err != nil {
		return err
	}

	if err := m.diffTags(sceneEdit, sceneID, input.Details.TagIds); err != nil {
		return err
	}

	if err := m.diffImages(sceneEdit, sceneID, input.Details.ImageIds); err != nil {
		return err
	}

	return m.diffPerformers(sceneEdit, sceneID, input.Details.Performers)
}

func (m *SceneEditProcessor) diffFingerprints(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newFingerprints []*models.FingerprintEditInput) error {
	sqb := m.fac.Scene()
	fingerprints, err := sqb.GetFingerprints(sceneID)
	if err != nil {
		return err
	}
	sceneEdit.New.AddedFingerprints, sceneEdit.New.RemovedFingerprints = sceneFingerprintCompare(newFingerprints, fingerprints)
	return nil
}

func sceneFingerprintCompare(subject []*models.FingerprintEditInput, against models.SceneFingerprints) (added []*models.FingerprintEditInput, missing []*models.FingerprintEditInput) {
	eq := func(s *models.FingerprintEditInput, a *models.SceneFingerprint) bool {
		return s.Algorithm.String() == a.Algorithm && s.Hash == a.Hash && s.Duration == a.Duration && s.Submissions == a.Submissions
	}

	eqI := func(s, a *models.FingerprintEditInput) bool {
		return s.Algorithm.String() == a.Algorithm.String() && s.Hash == a.Hash && s.Duration == a.Duration && s.Submissions == a.Submissions
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
			missing = append(missing, &models.FingerprintEditInput{
				Hash:        s.Hash,
				Algorithm:   models.FingerprintAlgorithm(s.Algorithm),
				Duration:    s.Duration,
				Submissions: s.Submissions,
				Created:     s.CreatedAt.Timestamp,
				Updated:     s.UpdatedAt.Timestamp,
			})
		}
	}
	return
}

func (m *SceneEditProcessor) diffTags(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newImageIds []string) error {
	tqb := m.fac.Tag()
	tags, err := tqb.FindBySceneID(sceneID)
	if err != nil {
		return err
	}

	existingTags := []string{}
	for _, tag := range tags {
		existingTags = append(existingTags, tag.ID.String())
	}
	sceneEdit.New.AddedTags, sceneEdit.New.RemovedTags = utils.StrSliceCompare(newImageIds, existingTags)
	return nil
}

func (m *SceneEditProcessor) diffURLs(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newURLs []*models.URL) error {
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
		if s.PerformerID == a.PerformerID.String() {
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
				PerformerID: s.PerformerID.String(),
				As:          as,
			})
		}
	}
	return
}

func (m *SceneEditProcessor) diffImages(sceneEdit *models.SceneEditData, sceneID uuid.UUID, newImageIds []string) error {
	iqb := m.fac.Image()
	images, err := iqb.FindBySceneID(sceneID)
	if err != nil {
		return err
	}

	existingImages := []string{}
	for _, image := range images {
		existingImages = append(existingImages, image.ID.String())
	}
	sceneEdit.New.AddedImages, sceneEdit.New.RemovedImages = utils.StrSliceCompare(newImageIds, existingImages)
	return nil
}

func (m *SceneEditProcessor) mergeEdit(input models.SceneEditInput, inputSpecified InputSpecifiedFunc) error {
	sqb := m.fac.Scene()

	// get the existing scene
	if input.Edit.ID == nil {
		return errors.New("Merge target ID is required")
	}
	sceneID, _ := uuid.FromString(*input.Edit.ID)
	scene, err := sqb.Find(sceneID)

	if err != nil {
		return err
	}

	if scene == nil {
		return errors.New("scene with id " + sceneID.String() + " not found")
	}

	mergeSources := []string{}
	for _, mergeSourceID := range input.Edit.MergeSourceIds {
		sourceID, _ := uuid.FromString(mergeSourceID)
		sourceScene, err := sqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourceScene == nil {
			return errors.New("scene with id " + sourceID.String() + " not found")
		}
		if sceneID == sourceID {
			return errors.New("merge target cannot be used as source")
		}
		mergeSources = append(mergeSources, mergeSourceID)
	}

	if len(mergeSources) < 1 {
		return errors.New("No merge sources found")
	}

	// perform a diff against the input and the current object
	sceneEdit := input.Details.SceneEditFromMerge(*scene, mergeSources)

	if err := m.diffRelationships(&sceneEdit, sceneID, input); err != nil {
		return err
	}

	return m.edit.SetData(sceneEdit)
}

func (m *SceneEditProcessor) createEdit(input models.SceneEditInput, inputSpecified InputSpecifiedFunc) error {
	sceneEdit := input.Details.SceneEditFromCreate()

	sceneEdit.New.AddedUrls = input.Details.Urls
	sceneEdit.New.AddedTags = input.Details.TagIds
	sceneEdit.New.AddedImages = input.Details.ImageIds
	sceneEdit.New.AddedFingerprints = input.Details.Fingerprints
	sceneEdit.New.AddedPerformers = input.Details.Performers

	return m.edit.SetData(sceneEdit)
}

func (m *SceneEditProcessor) destroyEdit(input models.SceneEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := m.fac.Scene()

	// get the existing scene
	sceneID, _ := uuid.FromString(*input.Edit.ID)
	_, err := tqb.Find(sceneID)

	if err != nil {
		return err
	}

	return nil
}

func (m *SceneEditProcessor) CreateJoin(input models.SceneEditInput) error {
	if input.Edit.ID != nil {
		sceneID, _ := uuid.FromString(*input.Edit.ID)

		editScene := models.EditScene{
			EditID:  m.edit.ID,
			SceneID: sceneID,
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
			return errors.New("Scene not found: " + sceneID.String())
		}
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
		return m.applyCreate(data)
	case models.OperationEnumDestroy:
		return m.applyDestroy(scene)
	case models.OperationEnumModify:
		return m.applyModify(scene, data)
	case models.OperationEnumMerge:
		return m.applyMerge(scene, data)
	default:
		return nil, errors.New("Unsupported operation: " + operation.String())
	}
}

func (m *SceneEditProcessor) applyCreate(data *models.SceneEditData) (*models.Scene, error) {
	now := time.Now()
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}
	newScene := &models.Scene{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: now},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: now},
	}

	qb := m.fac.Scene()

	const create = true
	return qb.ApplyEdit(newScene, create, data)
}

func (m *SceneEditProcessor) applyModify(scene *models.Scene, data *models.SceneEditData) (*models.Scene, error) {
	if err := scene.ValidateModifyEdit(*data); err != nil {
		return nil, err
	}

	qb := m.fac.Scene()
	const create = false
	return qb.ApplyEdit(scene, create, data)
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

	for _, v := range data.MergeSources {
		sourceUUID, _ := uuid.FromString(v)
		if err := m.mergeInto(sourceUUID, scene.ID); err != nil {
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
		return errors.New("Merge source scene not found: " + sourceID.String())
	}

	target, err := qb.Find(targetID)
	if err != nil {
		return err
	}
	if target == nil {
		return errors.New("Merge target scene not found: " + targetID.String())
	}

	_, err = qb.SoftDelete(*scene)
	if err != nil {
		return err
	}
	return qb.MergeInto(scene, target)
}
