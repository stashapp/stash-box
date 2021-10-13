package edit

import (
	"errors"

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
	default:
		panic("not implemented")
	}

	return err
}

func (m *PerformerEditProcessor) modifyEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := m.fac.Performer()

	// get the existing performer
	performerID, _ := uuid.FromString(*input.Edit.ID)
	performer, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	if performer == nil {
		return errors.New("performer with id " + performerID.String() + " not found")
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

	existingImages := []string{}
	for _, image := range images {
		existingImages = append(existingImages, image.ID.String())
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)

	if input.Options != nil && input.Options.SetModifyAliases != nil {
		performerEdit.SetModifyAliases = *input.Options.SetModifyAliases
	}

	return m.edit.SetData(performerEdit)
}

func (m *PerformerEditProcessor) mergeEdit(input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := m.fac.Performer()

	// get the existing performer
	if input.Edit.ID == nil {
		return errors.New("Merge performer ID is required")
	}
	performerID, _ := uuid.FromString(*input.Edit.ID)
	performer, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	if performer == nil {
		return errors.New("performer with id " + performerID.String() + " not found")
	}

	mergeSources := []string{}
	for _, mergeSourceID := range input.Edit.MergeSourceIds {
		sourceID, _ := uuid.FromString(mergeSourceID)
		sourcePerformer, err := pqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourcePerformer == nil {
			return errors.New("performer with id " + sourceID.String() + " not found")
		}
		if performerID == sourceID {
			return errors.New("merge target cannot be used as source")
		}
		mergeSources = append(mergeSources, mergeSourceID)
	}

	if len(mergeSources) < 1 {
		return errors.New("No merge sources found")
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

	existingImages := []string{}
	for _, image := range images {
		existingImages = append(existingImages, image.ID.String())
	}
	performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)

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
	performerID, _ := uuid.FromString(*input.Edit.ID)
	_, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	return nil
}

func (m *PerformerEditProcessor) CreateJoin(input models.PerformerEditInput) error {
	if input.Edit.ID != nil {
		performerID, _ := uuid.FromString(*input.Edit.ID)

		editTag := models.EditPerformer{
			EditID:      m.edit.ID,
			PerformerID: performerID,
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
			return errors.New("Performer not found: " + performerID.String())
		}
	}
	newPerformer, err := pqb.ApplyEdit(*m.edit, operation, performer)
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
