package edit

import (
	"errors"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

// InputSpecifiedFunc is function that returns true if the qualified field name
// was specified in the input. Used to distinguish between nil/empty fields and
// unspecified fields
type InputSpecifiedFunc func(qualifiedField string) bool

func ModifyTagEdit(fac models.Repo, edit *models.Edit, input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := fac.Tag()

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

	return edit.SetData(tagEdit)
}

func MergeTagEdit(fac models.Repo, edit *models.Edit, input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := fac.Tag()

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

	return edit.SetData(tagEdit)
}

func CreateTagEdit(fac models.Repo, edit *models.Edit, input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tagEdit := input.Details.TagEditFromCreate()

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		tagEdit.New.AddedAliases = input.Details.Aliases
	}

	return edit.SetData(tagEdit)
}

func DestroyTagEdit(fac models.Repo, edit *models.Edit, input models.TagEditInput, inputSpecified InputSpecifiedFunc) error {
	tqb := fac.Tag()

	// get the existing tag
	tagID, _ := uuid.FromString(*input.Edit.ID)
	_, err := tqb.Find(tagID)

	if err != nil {
		return err
	}

	return nil
}
