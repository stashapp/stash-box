package edit

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

type TagEditProcessor struct {
	mutator
}

func Tag(fac models.Repo, edit *models.Edit) *TagEditProcessor {
	return &TagEditProcessor{
		mutator{
			fac:  fac,
			edit: edit,
		},
	}
}

func (m *TagEditProcessor) Edit(input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
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

func (m *TagEditProcessor) modifyEdit(input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := m.fac.Tag()

	// get the existing tag
	tagID, _ := uuid.FromString(*input.Edit.ID)
	tag, err := tqb.Find(tagID)

	if err != nil {
		return err
	}

	if tag == nil {
		return errors.New("tag with id " + tagID.String() + " not found")
	}

	// perform a diff against the input and the current object
	tagEdit := input.Details.TagEditFromDiff(*tag)

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		aliases, err := tqb.GetAliases(tagID)

		if err != nil {
			return err
		}

		tagEdit.New.AddedAliases, tagEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases)
	}

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) mergeEdit(input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := m.fac.Tag()

	// get the existing tag
	if input.Edit.ID == nil {
		return errors.New("Merge target ID is required")
	}
	tagID, _ := uuid.FromString(*input.Edit.ID)
	tag, err := tqb.Find(tagID)

	if err != nil {
		return err
	}

	if tag == nil {
		return errors.New("tag with id " + tagID.String() + " not found")
	}

	mergeSources := []string{}
	for _, mergeSourceID := range input.Edit.MergeSourceIds {
		sourceID, _ := uuid.FromString(mergeSourceID)
		sourceTag, err := tqb.Find(sourceID)
		if err != nil {
			return err
		}

		if sourceTag == nil {
			return errors.New("tag with id " + sourceID.String() + " not found")
		}
		if tagID == sourceID {
			return errors.New("merge target cannot be used as source")
		}
		mergeSources = append(mergeSources, mergeSourceID)
	}

	if len(mergeSources) < 1 {
		return errors.New("No merge sources found")
	}

	// perform a diff against the input and the current object
	tagEdit := input.Details.TagEditFromMerge(*tag, mergeSources)

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		aliases, err := tqb.GetAliases(tagID)

		if err != nil {
			return err
		}

		tagEdit.New.AddedAliases, tagEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases)
	}

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) createEdit(input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tagEdit := input.Details.TagEditFromCreate()

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		tagEdit.New.AddedAliases = input.Details.Aliases
	}

	return m.edit.SetData(tagEdit)
}

func (m *TagEditProcessor) destroyEdit(input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := m.fac.Tag()

	// get the existing tag
	tagID, _ := uuid.FromString(*input.Edit.ID)
	_, err := tqb.Find(tagID)

	return err
}

func (m *TagEditProcessor) CreateJoin(input models.TagEditInput) error {
	if input.Edit.ID != nil {
		tagID, _ := uuid.FromString(*input.Edit.ID)

		editTag := models.EditTag{
			EditID: m.edit.ID,
			TagID:  tagID,
		}

		return m.fac.Edit().CreateEditTag(editTag)
	}

	return nil
}

func (m *TagEditProcessor) apply() error {
	tqb := m.fac.Tag()
	eqb := m.fac.Edit()
	operation := m.operation()
	isCreate := operation == models.OperationEnumCreate

	var tag *models.Tag
	if !isCreate {
		tagID, err := eqb.FindTagID(m.edit.ID)
		if err != nil {
			return err
		}
		tag, err = tqb.Find(*tagID)
		if err != nil {
			return err
		}
		if tag == nil {
			return errors.New("Tag not found: " + tagID.String())
		}
	}

	newTag, err := tqb.ApplyEdit(*m.edit, operation, tag)
	if err != nil {
		return err
	}

	if isCreate {
		editTag := models.EditTag{
			EditID: m.edit.ID,
			TagID:  newTag.ID,
		}

		err = eqb.CreateEditTag(editTag)
		if err != nil {
			return err
		}
	}

	return nil
}
