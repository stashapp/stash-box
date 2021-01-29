package edit

import (
	"errors"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func ModifyPerformerEdit(tx *sqlx.Tx, edit *models.Edit, input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := models.NewPerformerQueryBuilder(tx)

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

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		aliases, err := pqb.GetAliases(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases.ToAliases())
	}

	if len(input.Details.Tattoos) != 0 || inputSpecified("tattoos") {
		tattoos, err := pqb.GetTattoos(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = BodyModCompare(input.Details.Tattoos, tattoos.ToBodyModifications())
	}

	if len(input.Details.Piercings) != 0 || inputSpecified("piercings") {
		piercings, err := pqb.GetPiercings(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = BodyModCompare(input.Details.Piercings, piercings.ToBodyModifications())
	}

	if len(input.Details.Urls) != 0 || inputSpecified("urls") {
		urls, err := pqb.GetUrls(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = URLCompare(input.Details.Urls, urls)
	}

	if len(input.Details.ImageIds) != 0 || inputSpecified("image_ids") {
		iqb := models.NewImageQueryBuilder(tx)
		images, err := iqb.FindByPerformerID(performerID)

		if err != nil {
			return err
		}

		existingImages := []string{}
		for _, image := range images {
			existingImages = append(existingImages, image.ID.String())
		}

		performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)
	}

	edit.SetData(performerEdit)
	return nil
}

func MergePerformerEdit(tx *sqlx.Tx, edit *models.Edit, input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := models.NewPerformerQueryBuilder(tx)

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
	for _, mergeSourceId := range input.Edit.MergeSourceIds {
		sourceID, _ := uuid.FromString(mergeSourceId)
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
		mergeSources = append(mergeSources, mergeSourceId)
	}

	if len(mergeSources) < 1 {
		return errors.New("No merge sources found")
	}

	// perform a diff against the input and the current object
	performerEdit := input.Details.PerformerEditFromMerge(*performer, mergeSources)

	// determine unspecified aliases vs no aliases
	if len(input.Details.Aliases) != 0 || inputSpecified("aliases") {
		aliases, err := pqb.GetAliases(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedAliases, performerEdit.New.RemovedAliases = utils.StrSliceCompare(input.Details.Aliases, aliases.ToAliases())
	}

	if len(input.Details.Tattoos) != 0 || inputSpecified("tattoos") {
		tattoos, err := pqb.GetTattoos(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedTattoos, performerEdit.New.RemovedTattoos = BodyModCompare(input.Details.Tattoos, tattoos.ToBodyModifications())
	}

	if len(input.Details.Piercings) != 0 || inputSpecified("piercings") {
		piercings, err := pqb.GetPiercings(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedPiercings, performerEdit.New.RemovedPiercings = BodyModCompare(input.Details.Piercings, piercings.ToBodyModifications())
	}

	if len(input.Details.Urls) != 0 || inputSpecified("urls") {
		urls, err := pqb.GetUrls(performerID)

		if err != nil {
			return err
		}

		performerEdit.New.AddedUrls, performerEdit.New.RemovedUrls = URLCompare(input.Details.Urls, urls)
	}

	if len(input.Details.ImageIds) != 0 || inputSpecified("image_ids") {
		iqb := models.NewImageQueryBuilder(tx)
		images, err := iqb.FindByPerformerID(performerID)

		if err != nil {
			return err
		}

		existingImages := []string{}
		for _, image := range images {
			existingImages = append(existingImages, image.ID.String())
		}

		performerEdit.New.AddedImages, performerEdit.New.RemovedImages = utils.StrSliceCompare(input.Details.ImageIds, existingImages)
	}

	edit.SetData(performerEdit)
	return nil
}

func CreatePerformerEdit(tx *sqlx.Tx, edit *models.Edit, input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
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

	edit.SetData(performerEdit)
	return nil
}

func DestroyPerformerEdit(tx *sqlx.Tx, edit *models.Edit, input models.PerformerEditInput, inputSpecified InputSpecifiedFunc) error {
	pqb := models.NewPerformerQueryBuilder(tx)

	// get the existing performer
	performerID, _ := uuid.FromString(*input.Edit.ID)
	_, err := pqb.Find(performerID)

	if err != nil {
		return err
	}

	return nil
}

func BodyModCompare(subject []*models.BodyModification, against []*models.BodyModification) (added []*models.BodyModification, missing []*models.BodyModification) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.Location == a.Location {
				newMod = false
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
				removedMod = false
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

func URLCompare(subject []*models.URL, against []*models.URL) (added []*models.URL, missing []*models.URL) {
	for _, s := range subject {
		newMod := true
		for _, a := range against {
			if s.URL == a.URL {
				newMod = false
			}
		}

		for _, a := range added {
			if s.URL == a.URL {
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
			if s.URL == a.URL {
				removedMod = false
			}
		}

		for _, a := range missing {
			if s.URL == a.URL {
				removedMod = false
			}
		}

		if removedMod {
			missing = append(missing, s)
		}
	}
	return
}
