package edit

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type StudioEditProcessor struct {
	mutator
}

func Studio(fac models.Repo, edit *models.Edit) *StudioEditProcessor {
	return &StudioEditProcessor{
		mutator{
			fac:  fac,
			edit: edit,
		},
	}
}

func (m *StudioEditProcessor) Edit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
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

func (m *StudioEditProcessor) modifyEdit(input models.StudioEditInput, _ InputSpecifiedFunc) error {
	sqb := m.fac.Studio()

	// get the existing studio
	studioID, _ := uuid.FromString(*input.Edit.ID)
	studio, err := sqb.Find(studioID)

	if err != nil {
		return err
	}

	if studio == nil {
		return errors.New("studio with id " + studioID.String() + " not found")
	}

	// perform a diff against the input and the current object
	studioEdit := input.Details.StudioEditFromDiff(*studio)

	urls, err := sqb.GetURLs(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(input.Details.Urls, urls)

	iqb := m.fac.Image()
	images, err := iqb.FindByStudioID(studioID)
	if err != nil {
		return err
	}

	existingImages := []string{}
	for _, image := range images {
		existingImages = append(existingImages, image.ID.String())
	}
	studioEdit.New.AddedImages, studioEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) mergeEdit(input models.StudioEditInput, _ InputSpecifiedFunc) error {
	sqb := m.fac.Studio()

	// get the existing studio
	if input.Edit.ID == nil {
		return errors.New("Merge target ID is required")
	}
	studioID, _ := uuid.FromString(*input.Edit.ID)
	studio, err := sqb.Find(studioID)

	if err != nil {
		return err
	}

	if studio == nil {
		return errors.New("studio with id " + studioID.String() + " not found")
	}

	mergeSources := []string{}
	for _, mergeSourceID := range input.Edit.MergeSourceIds {
		sourceID, _ := uuid.FromString(mergeSourceID)
		sourceStudio, err := sqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourceStudio == nil {
			return errors.New("studio with id " + sourceID.String() + " not found")
		}
		if studioID == sourceID {
			return errors.New("merge target cannot be used as source")
		}
		mergeSources = append(mergeSources, mergeSourceID)
	}

	if len(mergeSources) < 1 {
		return errors.New("No merge sources found")
	}

	// perform a diff against the input and the current object
	studioEdit := input.Details.StudioEditFromMerge(*studio, mergeSources)

	urls, err := sqb.GetURLs(studioID)
	if err != nil {
		return err
	}
	studioEdit.New.AddedUrls, studioEdit.New.RemovedUrls = urlCompare(input.Details.Urls, urls)

	iqb := m.fac.Image()
	images, err := iqb.FindByStudioID(studioID)
	if err != nil {
		return err
	}

	existingImages := []string{}
	for _, image := range images {
		existingImages = append(existingImages, image.ID.String())
	}
	studioEdit.New.AddedImages, studioEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) createEdit(input models.StudioEditInput, inputSpecified InputSpecifiedFunc) error {
	studioEdit := input.Details.StudioEditFromCreate()

	if len(input.Details.Urls) != 0 || inputSpecified("urls") {
		studioEdit.New.AddedUrls = input.Details.Urls
	}

	if len(input.Details.ImageIds) != 0 || inputSpecified("image_ids") {
		studioEdit.New.AddedImages = input.Details.ImageIds
	}

	return m.edit.SetData(studioEdit)
}

func (m *StudioEditProcessor) destroyEdit(input models.StudioEditInput, _ InputSpecifiedFunc) error {
	tqb := m.fac.Studio()

	// get the existing studio
	studioID, _ := uuid.FromString(*input.Edit.ID)
	_, err := tqb.Find(studioID)

	if err != nil {
		return err
	}

	return nil
}

func (m *StudioEditProcessor) CreateJoin(input models.StudioEditInput) error {
	if input.Edit.ID != nil {
		studioID, _ := uuid.FromString(*input.Edit.ID)

		editStudio := models.EditStudio{
			EditID:   m.edit.ID,
			StudioID: studioID,
		}

		return m.fac.Edit().CreateEditStudio(editStudio)
	}

	return nil
}

func (m *StudioEditProcessor) apply() error {
	sqb := m.fac.Studio()
	eqb := m.fac.Edit()
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var studio *models.Studio
	if !isCreate {
		studioID, err := eqb.FindStudioID(m.edit.ID)
		if err != nil {
			return err
		}
		studio, err = sqb.Find(*studioID)
		if err != nil {
			return err
		}
		if studio == nil {
			return errors.New("Studio not found: " + studioID.String())
		}
	}

	newStudio, err := sqb.ApplyEdit(*m.edit, operation, studio)
	if err != nil {
		return err
	}

	if isCreate {
		editStudio := models.EditStudio{
			EditID:   m.edit.ID,
			StudioID: newStudio.ID,
		}

		err = eqb.CreateEditStudio(editStudio)
		if err != nil {
			return err
		}
	}

	return nil
}
