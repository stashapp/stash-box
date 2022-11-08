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

func (m *PerformerEditProcessor) Edit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	var err error
	switch input.Edit.Operation {
	case models.OperationEnumModify:
		err = m.modifyEdit(input, inputArgs)
	case models.OperationEnumMerge:
		err = m.mergeEdit(input, inputArgs)
	case models.OperationEnumDestroy:
		err = m.destroyEdit(input)
	case models.OperationEnumCreate:
		err = m.createEdit(input, inputArgs)
	}

	return err
}

func (m *PerformerEditProcessor) modifyEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
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
	performerEdit, err := input.Details.PerformerEditFromDiff(*performer, inputArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(performerEdit, performerID, input, inputArgs); err != nil {
		return err
	}

	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	if reflect.DeepEqual(performerEdit.Old, performerEdit.New) {
		return ErrNoChanges
	}

	performerEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) mergeEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
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
	performerEdit, err := input.Details.PerformerEditFromMerge(*performer, mergeSources, inputArgs)
	if err != nil {
		return err
	}

	if err = m.diffRelationships(performerEdit, performerID, input, inputArgs); err != nil {
		return err
	}

	if input.Options != nil && input.Options.SetMergeAliases != nil {
		performerEdit.SetMergeAliases = *input.Options.SetMergeAliases
	}
	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) createEdit(input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	performerEdit, err := input.Details.PerformerEditFromCreate(inputArgs)
	if err != nil {
		return err
	}

	performerEdit.New.AddedAliases = input.Details.Aliases
	performerEdit.New.AddedTattoos = input.Details.Tattoos
	performerEdit.New.AddedPiercings = input.Details.Piercings
	performerEdit.New.AddedImages = input.Details.ImageIds

	var addedUrls []*models.URL
	for _, url := range input.Details.Urls {
		addedUrls = append(addedUrls, &models.URL{URL: url.URL, SiteID: url.SiteID})
	}
	performerEdit.New.AddedUrls = addedUrls

	performerEdit.New.DraftID = input.Details.DraftID

	return m.edit.SetData(*performerEdit)
}

func (m *PerformerEditProcessor) destroyEdit(input models.PerformerEditInput) error {
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

		performer.UpdatedAt = time.Now()
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
	UUID := data.New.DraftID
	if UUID == nil {
		newUUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}
		UUID = &newUUID
	}
	newPerformer := &models.Performer{
		ID:        *UUID,
		CreatedAt: now,
		UpdatedAt: now,
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

	if err = qb.DeleteScenePerformers(performer.ID); err != nil {
		return nil, err
	}
	if err = qb.DeletePerformerFavorites(performer.ID); err != nil {
		return nil, err
	}

	return updatedPerformer, nil
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

func (m *PerformerEditProcessor) diffRelationships(performerEdit *models.PerformerEditData, performerID uuid.UUID, input models.PerformerEditInput, inputArgs utils.ArgumentsQuery) error {
	if input.Details.Aliases != nil || inputArgs.Field("aliases").IsNull() {
		if err := m.diffAliases(performerEdit, performerID, input.Details.Aliases); err != nil {
			return err
		}
	}

	if input.Details.Tattoos != nil || inputArgs.Field("tattoos").IsNull() {
		if err := m.diffTattoos(performerEdit, performerID, input.Details.Tattoos); err != nil {
			return err
		}
	}

	if input.Details.Piercings != nil || inputArgs.Field("piercings").IsNull() {
		if err := m.diffPiercings(performerEdit, performerID, input.Details.Piercings); err != nil {
			return err
		}
	}

	if input.Details.Urls != nil || inputArgs.Field("urls").IsNull() {
		if err := m.diffURLs(performerEdit, performerID, input.Details.Urls); err != nil {
			return err
		}
	}

	if input.Details.ImageIds != nil || inputArgs.Field("image_ids").IsNull() {
		if err := m.diffImages(performerEdit, performerID, input.Details.ImageIds); err != nil {
			return err
		}
	}

	return nil
}

func (m *PerformerEditProcessor) diffAliases(performerEdit *models.PerformerEditData, performerID uuid.UUID, newAliases []string) error {
	pqb := m.fac.Performer()

	aliases, err := pqb.GetAliases(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.SliceCompare(newAliases, aliases.ToAliases())
	return nil
}

func (m *PerformerEditProcessor) diffTattoos(performerEdit *models.PerformerEditData, performerID uuid.UUID, newTattoos []*models.BodyModification) error {
	pqb := m.fac.Performer()

	tattoos, err := pqb.GetTattoos(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = bodyModCompare(newTattoos, tattoos.ToBodyModifications())

	return nil
}

func (m *PerformerEditProcessor) diffPiercings(performerEdit *models.PerformerEditData, performerID uuid.UUID, newPiercings []*models.BodyModification) error {
	pqb := m.fac.Performer()

	piercings, err := pqb.GetPiercings(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = bodyModCompare(newPiercings, piercings.ToBodyModifications())

	return nil
}

func (m *PerformerEditProcessor) diffURLs(performerEdit *models.PerformerEditData, performerID uuid.UUID, newURLs []*models.URLInput) error {
	pqb := m.fac.Performer()

	urls, err := pqb.GetURLs(performerID)
	if err != nil {
		return err
	}
	performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = urlCompare(newURLs, urls)

	return nil
}

func (m *PerformerEditProcessor) diffImages(performerEdit *models.PerformerEditData, performerID uuid.UUID, newImages []uuid.UUID) error {
	iqb := m.fac.Image()
	images, err := iqb.FindByPerformerID(performerID)
	if err != nil {
		return err
	}

	var existingImages []uuid.UUID
	for _, image := range images {
		existingImages = append(existingImages, image.ID)
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.SliceCompare(newImages, existingImages)

	return nil
}
