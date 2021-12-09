package edit

import (
	"fmt"
	"reflect"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type PerformerEditProcessor struct {
	mutator
}

func Performer(fac models.Repo, edit *models.Edit) *PerformerEditProcessor {
	return &PerformerEditProcessor{
		mutator{
			fac:  fac,
			edit: edit,
		},
	}
}

func (m *PerformerEditProcessor) Edit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
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
	}

	return err
}

func (m *PerformerEditProcessor) modifyEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := m.fac.Performer()

	// get the existing performer
	performerID := *input.Edit.ID
	performer, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	if performer == nil {
		return fmt.Errorf("performer with id %v not found", performerID)
	}

	// perform a diff against the input and the current object
	performerEdit := input.Details.PerformerEditFromDiff(*performer)

	aliases, err := pqb.GetAliases(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases.ToAliases())

	tattoos, err := pqb.GetTattoos(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = bodyModCompare(input.Details.Tattoos, tattoos.ToBodyModifications())

	piercings, err := pqb.GetPiercings(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = bodyModCompare(input.Details.Piercings, piercings.ToBodyModifications())

	urls, err := pqb.GetURLs(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = urlCompare(input.Details.Urls, urls)

	iqb := m.fac.Image()
	images, err := iqb.FindByPerformerID(performerID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.UUIDSliceCompare(input.Details.ImageIds, existingImages)

	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	if reflect.DeepEqual(performerEdit.Old, performerEdit.New) {
		return ErrNoChanges
	}

	return m.edit.SetData(performerEdit)
}

func (m *PerformerEditProcessor) mergeEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := m.fac.Performer()

	// get the existing performer
	if input.Edit.ID == nil {
		return ErrMergeIDMissing
	}
	performerID := *input.Edit.ID
	performer, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	if performer == nil {
		return fmt.Errorf("performer with id %v not found", *input.Edit.ID)
	}

	var mergeSources []uuid.UUID
	for _, sourceID := range input.Edit.MergeSourceIds {
		sourcePerformer, err := pqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourcePerformer == nil {
			return fmt.Errorf("performer with id %v not found", sourceID)
		}
		if performerID == sourceID {
			return ErrMergeTargetIsSource
		}
		mergeSources = append(mergeSources, sourceID)
	}

	if len(mergeSources) < 1 {
		return ErrNoMergeSources
	}

	// perform a diff against the input and the current object
	performerEdit := input.Details.PerformerEditFromMerge(*performer, mergeSources)

	aliases, err := pqb.GetAliases(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases.ToAliases())

	tattoos, err := pqb.GetTattoos(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = bodyModCompare(input.Details.Tattoos, tattoos.ToBodyModifications())

	piercings, err := pqb.GetPiercings(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = bodyModCompare(input.Details.Piercings, piercings.ToBodyModifications())

	urls, err := pqb.GetURLs(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = urlCompare(input.Details.Urls, urls)

	iqb := m.fac.Image()
	images, err := iqb.FindByPerformerID(performerID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.UUIDSliceCompare(input.Details.ImageIds, existingImages)

	if input.Options != nil && input.Options.SetMergeAliases != nil {
		performerEdit.SetMergeAliases = *input.Options.SetMergeAliases
	}
	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	return m.edit.SetData(performerEdit)
}

func (m *PerformerEditProcessor) createEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	performerEdit := input.Details.PerformerEditFromCreate()

	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		performerEdit.New.AddedAliases = input.Details.Aliases
	}

	if len(input.Details.Tattoos) != 0 || inputSpecified("tattoos") {
		performerEdit.New.AddedTattoos = input.Details.Tattoos
	}

	if len(input.Details.Piercings) != 0 || inputSpecified("piercings") {
		performerEdit.New.AddedPiercings = input.Details.Piercings
	}

	if len(input.Details.Urls) != 0 || inputSpecified("urls") {
		performerEdit.New.AddedUrls = input.Details.Urls
	}

	if len(input.Details.ImageIds) != 0 || inputSpecified("image_ids") {
		performerEdit.New.AddedImages = input.Details.ImageIds
	}

	return m.edit.SetData(performerEdit)
}

func (m *PerformerEditProcessor) destroyEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := m.fac.Performer()

	// get the existing performer
	_, err := pqb.Find(*input.Edit.ID)

	return err
}

func (m *PerformerEditProcessor) CreateJoin(input models.PerformerEditInput) error {
	if input.Edit.ID != nil {
		editTag := models.EditPerformer{
			EditID:      m.edit.ID,
			PerformerID: *input.Edit.ID,
		}

		return m.fac.Edit().CreateEditPerformer(editTag)
	}

	return nil
}

func (m *PerformerEditProcessor) apply() error {
	pqb := m.fac.Performer()
	eqb := m.fac.Edit()
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var performer *models.Performer
	if !isCreate {
		performerID, err := eqb.FindPerformerID(m.edit.ID)
		if err != nil {
			return err
		}
		performer, err = pqb.Find(*performerID)
		if err != nil {
			return err
		}
		if performer == nil {
			return fmt.Errorf("%w: performer %s", ErrEntityNotFound, performerID.String())
		}
	}
	newPerformer, err := m.applyEdit(performer)
	if err != nil {
		return err
	}

	if isCreate {
		editPerformer := models.EditPerformer{
			EditID:      m.edit.ID,
			PerformerID: newPerformer.ID,
		}

		err = eqb.CreateEditPerformer(editPerformer)
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *PerformerEditProcessor) applyEdit(performer *models.Performer) (*models.Performer, error) {
	data, err := m.edit.GetPerformerData()
	if err != nil {
		return nil, err
	}

	operation := m.operation()

	switch operation {
	case models.OperationEnumCreate:
		return m.applyCreate(data)
	case models.OperationEnumDestroy:
		return m.applyDestroy(performer)
	case models.OperationEnumModify:
		return m.applyModify(performer, data)
	case models.OperationEnumMerge:
		return m.applyMerge(performer, data)
	}
	return nil, nil
}

func (m *PerformerEditProcessor) applyCreate(data *models.PerformerEditData) (*models.Performer, error) {
	now := time.Now()
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}
	newPerformer := &models.Performer{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: now},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: now},
	}

	qb := m.fac.Performer()

	return qb.ApplyEdit(newPerformer, true, data)
}

func (m *PerformerEditProcessor) applyModify(performer *models.Performer, data *models.PerformerEditData) (*models.Performer, error) {
	if err := performer.ValidateModifyEdit(*data); err != nil {
		return nil, err
	}

	qb := m.fac.Performer()
	return qb.ApplyEdit(performer, false, data)
}

func (m *PerformerEditProcessor) applyDestroy(performer *models.Performer) (*models.Performer, error) {
	qb := m.fac.Performer()
	updatedPerformer, err := qb.SoftDelete(*performer)
	if err != nil {
		return nil, err
	}

	err = qb.DeleteScenePerformers(performer.ID)

	return updatedPerformer, err
}

func (m *PerformerEditProcessor) applyMerge(performer *models.Performer, data *models.PerformerEditData) (*models.Performer, error) {
	updatedPerformer, err := m.applyModify(performer, data)
	if err != nil {
		return nil, err
	}

	for _, sourceID := range data.MergeSources {
		if err := m.mergeInto(sourceID, performer.ID, data.SetMergeAliases); err != nil {
			return nil, err
		}
	}

	return updatedPerformer, nil
}

func (m *PerformerEditProcessor) mergeInto(sourceID uuid.UUID, targetID uuid.UUID, setAliases bool) error {
	qb := m.fac.Performer()
	performer, err := qb.Find(sourceID)
	if err != nil {
		return err
	}
	if performer == nil {
		return fmt.Errorf("%w: source performer %s", ErrEntityNotFound, sourceID.String())
	}

	target, err := qb.Find(targetID)
	if err != nil {
		return err
	}
	if target == nil {
		return fmt.Errorf("%w: target performer %s", ErrEntityNotFound, targetID.String())
	}

	return qb.MergeInto(performer, target, setAliases)
}

func bodyModCompare(subject []*models.BodyModification, against []*models.BodyModification) (added []*models.BodyModification, missing []*models.BodyModification) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.Location == a.Location {
				newMod = (s.Description != nil && a.Description != nil && *s.Description != *a.Description) ||
					(s.Description == nil && a.Description != nil) ||
					(a.Description == nil && s.Description != nil)
			}
		}

		for _, a := range added {
			if s.Location == a.Location {
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
			if s.Location == a.Location {
				removedMod = (s.Description != nil && a.Description != nil && *s.Description != *a.Description) ||
					(s.Description == nil && a.Description != nil) ||
					(a.Description == nil && s.Description != nil)
			}
		}

		for _, a := range missing {
			if s.Location == a.Location {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, s)
		}
	}
	return
}
