// +build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
)

type performerEditTestRunner struct {
	testRunner
}

func createPerformerEditTestRunner(t *testing.T) *performerEditTestRunner {
	return &performerEditTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *performerEditTestRunner) testCreatePerformerEdit() {
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	if err == nil {
		s.verifyCreatedPerformerEdit(*performerEditDetailsInput, edit)
	}
}

func (s *performerEditTestRunner) verifyCreatedPerformerEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	id, _ := r.ID(s.ctx, edit)
	if id == "" {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)
}

func (s *performerEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	if err != nil {
		return
	}

	editID := createdEdit.ID.String()
	edit, err := s.resolver.Query().FindEdit(s.ctx, &editID)
	if err != nil {
		s.t.Errorf("Error finding edit: %s", err.Error())
		return
	}

	// ensure returned performer is not nil
	if edit == nil {
		s.t.Error("Did not find edit by id")
		return
	}
}

func (s *performerEditTestRunner) testModifyPerformerEdit() {
	existingName := "performerName"

	existingBirthdate := models.FuzzyDateInput{
		Date:     "1990-01-02",
		Accuracy: models.DateAccuracyEnumDay,
	}
	performerCreateInput := models.PerformerCreateInput{
		Name:      existingName,
		Birthdate: &existingBirthdate,
	}
	createdPerformer, err := s.createTestPerformer(&performerCreateInput)
	if err != nil {
		return
	}

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.ID.String()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)

	s.verifyUpdatedPerformerEdit(createdPerformer, *performerEditDetailsInput, createdUpdateEdit)
}

func (s *performerEditTestRunner) verifyUpdatedPerformerEdit(originalPerformer *models.Performer, input models.PerformerEditDetailsInput, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)
}

func (s *performerEditTestRunner) verifyPerformerEditDetails(input models.PerformerEditDetailsInput, edit *models.Edit) {
	performerDetails := s.getEditPerformerDetails(edit)

	if *input.Name != *performerDetails.Name {
		s.fieldMismatch(input.Name, performerDetails.Name, "Name")
	}

	if *input.Disambiguation != *performerDetails.Disambiguation {
		s.fieldMismatch(input.Disambiguation, performerDetails.Disambiguation, "Disambiguation")
	}

	if !reflect.DeepEqual(input.Aliases, performerDetails.AddedAliases) {
		s.fieldMismatch(input.Aliases, performerDetails.AddedAliases, "Aliases")
	}

	if !input.Gender.IsValid() || (input.Gender.String() != *performerDetails.Gender) {
		s.fieldMismatch(input.Gender, performerDetails.Gender, "Disambiguation")
	}

	if !reflect.DeepEqual(input.Urls, performerDetails.AddedUrls) {
		s.fieldMismatch(input.Urls, performerDetails.AddedUrls, "URLs")
	}

	if !input.Birthdate.Accuracy.IsValid() || (input.Birthdate.Accuracy.String() != *performerDetails.BirthdateAccuracy) {
		s.fieldMismatch(input.Birthdate.Accuracy, performerDetails.BirthdateAccuracy, "BirthdateAccuracy")
	}

	if input.Birthdate.Date != *performerDetails.Birthdate {
		s.fieldMismatch(input.Birthdate.Date, performerDetails.Birthdate, "Birthdate")
	}

	if !input.Ethnicity.IsValid() || (input.Ethnicity.String() != *performerDetails.Ethnicity) {
		s.fieldMismatch(input.Ethnicity, performerDetails.Ethnicity, "Ethnicity")
	}

	if input.Country == nil || (*input.Country != *performerDetails.Country) {
		s.fieldMismatch(input.Country, performerDetails.Country, "Country")
	}

	if !input.EyeColor.IsValid() || (input.EyeColor.String() != *performerDetails.EyeColor) {
		s.fieldMismatch(input.EyeColor, performerDetails.EyeColor, "EyeColor")
	}

	if !input.HairColor.IsValid() || (input.HairColor.String() != *performerDetails.HairColor) {
		s.fieldMismatch(input.HairColor, performerDetails.HairColor, "HairColor")
	}

	if input.Height == nil || (int64(*input.Height) != *performerDetails.Height) {
		s.fieldMismatch(input.Height, performerDetails.Height, "Height")
	}

	if input.Measurements == nil || input.Measurements.BandSize == nil || (int64(*input.Measurements.BandSize) != *performerDetails.BandSize) {
		s.fieldMismatch(*input.Measurements.BandSize, *performerDetails.BandSize, "BandSize")
	}

	if input.Measurements == nil || input.Measurements.Waist == nil || (int64(*input.Measurements.Waist) != *performerDetails.WaistSize) {
		s.fieldMismatch(*input.Measurements.Waist, *performerDetails.WaistSize, "WaistSize")
	}

	if input.Measurements == nil || input.Measurements.Hip == nil || (int64(*input.Measurements.Hip) != *performerDetails.HipSize) {
		s.fieldMismatch(*input.Measurements.Hip, *performerDetails.HipSize, "HipSize")
	}

	if input.Measurements == nil || input.Measurements.CupSize == nil || (*input.Measurements.CupSize != *performerDetails.CupSize) {
		s.fieldMismatch(*input.Measurements.CupSize, *performerDetails.CupSize, "CupSize")
	}

	if !input.BreastType.IsValid() || (input.BreastType.String() != *performerDetails.BreastType) {
		s.fieldMismatch(input.BreastType, performerDetails.BreastType, "BreastType")
	}

	if input.CareerStartYear == nil || (int64(*input.CareerStartYear) != *performerDetails.CareerStartYear) {
		s.fieldMismatch(*input.CareerStartYear, *performerDetails.CareerStartYear, "CareerStartYear")
	}

	if input.CareerEndYear == nil || (int64(*input.CareerEndYear) != *performerDetails.CareerEndYear) {
		s.fieldMismatch(*input.CareerEndYear, *performerDetails.CareerEndYear, "CareerEndYear")
	}

	if !reflect.DeepEqual(input.Tattoos, performerDetails.AddedTattoos) {
		s.fieldMismatch(input.Tattoos, performerDetails.AddedTattoos, "Tattoos")
	}

	if !reflect.DeepEqual(input.Piercings, performerDetails.AddedPiercings) {
		s.fieldMismatch(input.Piercings, performerDetails.AddedPiercings, "Piercings")
	}

	if !reflect.DeepEqual(input.ImageIds, performerDetails.AddedImages) {
		s.fieldMismatch(input.ImageIds, performerDetails.AddedImages, "Images")
	}
}

func (s *performerEditTestRunner) verifyPerformerEdit(input models.PerformerEditDetailsInput, performer *models.Performer) {
	resolver := s.resolver.Performer()

	if input.Name != nil && *input.Name != performer.Name {
		s.fieldMismatch(input.Name, performer.Name, "Name")
	}

	if input.Disambiguation == nil {
		if performer.Disambiguation.Valid {
			s.fieldMismatch(input.Disambiguation, performer.Disambiguation.String, "Disambiguation")
		}
	} else if *input.Disambiguation != performer.Disambiguation.String {
		s.fieldMismatch(*input.Disambiguation, performer.Disambiguation.String, "Disambiguation")
	}

	aliases, _ := resolver.Aliases(s.ctx, performer)
	if (len(input.Aliases) > 0 || len(aliases) > 0) && !reflect.DeepEqual(input.Aliases, aliases) {
		s.fieldMismatch(input.Aliases, aliases, "Aliases")
	}

	if input.Gender == nil {
		if performer.Gender.Valid {
			s.fieldMismatch(input.Gender, performer.Gender.String, "Disambiguation")
		}
	} else if input.Gender.String() != performer.Gender.String {
		s.fieldMismatch(*input.Gender, performer.Gender.String, "Disambiguation")
	}

	urls, _ := resolver.Urls(s.ctx, performer)
	if (len(input.Urls) > 0 || len(urls) > 0) && !reflect.DeepEqual(input.Urls, urls) {
		s.fieldMismatch(input.Urls, urls, "Urls")
	}

	if input.Birthdate == nil {
		if performer.BirthdateAccuracy.Valid {
			s.fieldMismatch(input.Birthdate, performer.BirthdateAccuracy.String, "BirthdateAccuracy")
		}
	} else if input.Birthdate.Accuracy.String() != performer.BirthdateAccuracy.String {
		s.fieldMismatch(input.Birthdate.Accuracy.String(), performer.BirthdateAccuracy.String, "BirthdateAccuracy")
	}

	if input.Birthdate == nil {
		if performer.Birthdate.Valid {
			s.fieldMismatch(input.Birthdate, performer.Birthdate.String, "Birthdate")
		}
	} else if input.Birthdate.Date != performer.Birthdate.String {
		s.fieldMismatch(input.Birthdate.Date, performer.Birthdate.String, "Birthdate")
	}

	if input.Ethnicity == nil {
		if performer.Ethnicity.Valid {
			s.fieldMismatch(input.Ethnicity, performer.Ethnicity.String, "Ethnicity")
		}
	} else if input.Ethnicity.String() != performer.Ethnicity.String {
		s.fieldMismatch(input.Ethnicity.String(), performer.Ethnicity.String, "Ethnicity")
	}

	if input.Country == nil {
		if performer.Country.Valid {
			s.fieldMismatch(input.Country, performer.Country.String, "Country")
		}
	} else if *input.Country != performer.Country.String {
		s.fieldMismatch(*input.Country, performer.Country.String, "Country")
	}

	if input.EyeColor == nil {
		if performer.EyeColor.Valid {
			s.fieldMismatch(input.EyeColor, performer.EyeColor.String, "EyeColor")
		}
	} else if input.EyeColor.String() != performer.EyeColor.String {
		s.fieldMismatch(input.EyeColor.String(), performer.EyeColor.String, "EyeColor")
	}

	if input.HairColor == nil {
		if performer.HairColor.Valid {
			s.fieldMismatch(input.HairColor, performer.HairColor.String, "HairColor")
		}
	} else if input.HairColor.String() != performer.HairColor.String {
		s.fieldMismatch(input.HairColor.String(), performer.HairColor.String, "HairColor")
	}

	if input.Height == nil {
		if performer.Height.Valid {
			s.fieldMismatch(input.Height, performer.Height.Int64, "Height")
		}
	} else if int64(*input.Height) != performer.Height.Int64 {
		s.fieldMismatch(*input.Height, performer.Height.Int64, "Height")
	}

	if input.Measurements == nil {
		if performer.BandSize.Valid {
			s.fieldMismatch(nil, performer.BandSize.Int64, "BandSize")
		}
		if performer.CupSize.Valid {
			s.fieldMismatch(nil, performer.CupSize.String, "CupSize")
		}
		if performer.WaistSize.Valid {
			s.fieldMismatch(nil, performer.WaistSize.Int64, "WaistSize")
		}
		if performer.HipSize.Valid {
			s.fieldMismatch(nil, performer.HipSize.Int64, "HipSize")
		}
	} else {
		if input.Measurements.BandSize == nil {
			if performer.BandSize.Valid {
				s.fieldMismatch(nil, performer.BandSize.Int64, "BandSize")
			}
		} else if int64(*input.Measurements.BandSize) != performer.BandSize.Int64 {
			s.fieldMismatch(*input.Measurements.BandSize, performer.BandSize.Int64, "BandSize")
		}

		if input.Measurements.CupSize == nil {
			if performer.CupSize.Valid {
				s.fieldMismatch(nil, performer.CupSize.String, "CupSize")
			}
		} else if *input.Measurements.CupSize != performer.CupSize.String {
			s.fieldMismatch(*input.Measurements.CupSize, performer.CupSize.String, "CupSize")
		}

		if input.Measurements.Waist == nil {
			if performer.WaistSize.Valid {
				s.fieldMismatch(nil, performer.WaistSize.Int64, "WaistSize")
			}
		} else if int64(*input.Measurements.Waist) != performer.WaistSize.Int64 {
			s.fieldMismatch(*input.Measurements.Waist, performer.WaistSize.Int64, "WaistSize")
		}

		if input.Measurements.Hip == nil {
			if performer.HipSize.Valid {
				s.fieldMismatch(nil, performer.HipSize.Int64, "HipSize")
			}
		} else if int64(*input.Measurements.Hip) != performer.HipSize.Int64 {
			s.fieldMismatch(*input.Measurements.Hip, performer.HipSize.Int64, "HipSize")
		}
	}

	if input.BreastType == nil {
		if performer.BreastType.Valid {
			s.fieldMismatch(input.BreastType, performer.BreastType.String, "BreastType")
		}
	} else if input.BreastType.String() != performer.BreastType.String {
		s.fieldMismatch(input.BreastType.String(), performer.BreastType.String, "BreastType")
	}

	if input.CareerEndYear == nil {
		if performer.CareerStartYear.Valid {
			s.fieldMismatch(input.CareerStartYear, performer.CareerStartYear.Int64, "CareerStartYear")
		}
	} else if int64(*input.CareerStartYear) != performer.CareerStartYear.Int64 {
		s.fieldMismatch(*input.CareerStartYear, performer.CareerStartYear.Int64, "CareerStartYear")
	}

	if input.CareerEndYear == nil {
		if performer.CareerEndYear.Valid {
			s.fieldMismatch(input.CareerEndYear, performer.CareerEndYear.Int64, "CareerEndYear")
		}
	} else if int64(*input.CareerEndYear) != performer.CareerEndYear.Int64 {
		s.fieldMismatch(*input.CareerEndYear, performer.CareerEndYear.Int64, "CareerEndYear")
	}

	tattoos, _ := resolver.Tattoos(s.ctx, performer)
	if (len(input.Tattoos) > 0 || len(tattoos) > 0) && !reflect.DeepEqual(input.Tattoos, tattoos) {
		s.fieldMismatch(input.Tattoos, tattoos, "Tattoos")
	}

	piercings, _ := resolver.Piercings(s.ctx, performer)
	if (len(input.Piercings) > 0 || len(piercings) > 0) && !reflect.DeepEqual(input.Piercings, piercings) {
		s.fieldMismatch(input.Piercings, piercings, "Piercings")
	}

	images, _ := resolver.Images(s.ctx, performer)
	var imageIds []string
	for _, image := range images {
		imageIds = append(imageIds, image.ID.String())
	}
	if !reflect.DeepEqual(input.ImageIds, imageIds) {
		s.fieldMismatch(input.ImageIds, imageIds, "Images")
	}
}

func (s *performerEditTestRunner) testDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	performerID := createdPerformer.ID.String()

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)

	s.verifyDestroyPerformerEdit(performerID, destroyEdit)
}

func (s *performerEditTestRunner) verifyDestroyPerformerEdit(performerID string, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditPerformerTarget(edit)

	if performerID != editTarget.ID.String() {
		s.fieldMismatch(performerID, editTarget.ID.String(), "ID")
	}
}

func (s *performerEditTestRunner) testMergePerformerEdit() {
	existingName := "performerName2"
	existingAlias := "performerAlias2"
	performerCreateInput := models.PerformerCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdPrimaryPerformer, err := s.createTestPerformer(&performerCreateInput)
	if err != nil {
		return
	}

	createdMergePerformer, err := s.createTestPerformer(nil)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPrimaryPerformer.ID.String()
	mergeSources := []string{createdMergePerformer.ID.String()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)

	s.verifyMergePerformerEdit(createdPrimaryPerformer, *performerEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *performerEditTestRunner) verifyMergePerformerEdit(originalPerformer *models.Performer, input models.PerformerEditDetailsInput, edit *models.Edit, inputMergeSources []string) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)

	mergeSources := []string{}
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Performer)
		mergeSources = append(mergeSources, merge.ID.String())
	}
	if !reflect.DeepEqual(inputMergeSources, mergeSources) {
		s.fieldMismatch(inputMergeSources, mergeSources, "MergeSources")
	}
}

func (s *performerEditTestRunner) testApplyCreatePerformerEdit() {
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	appliedEdit, err := s.applyEdit(edit.ID.String())
	if err == nil {
		s.verifyAppliedPerformerCreateEdit(*performerEditDetailsInput, appliedEdit)
	}
}

func (s *performerEditTestRunner) verifyAppliedPerformerCreateEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	id, _ := r.ID(s.ctx, edit)
	if id == "" {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	performer := s.getEditPerformerTarget(edit)
	s.verifyPerformerEdit(input, performer)
}

func (s *performerEditTestRunner) testApplyModifyPerformerEdit() {
	performerCreateInput := models.PerformerCreateInput{
		Name:    "performerName3",
		Aliases: []string{"modfied performer alias"},
		Tattoos: []*models.BodyModification{
			{
				Location: "some tattoo location",
			},
		},
		Piercings: []*models.BodyModification{
			{
				Location: "some piercing location",
			},
		},
		Urls: []*models.URL{
			{
				URL:  "http://example.org/asd",
				Type: "someothertype",
			},
		},
	}
	createdPerformer, err := s.createTestPerformer(&performerCreateInput)
	if err != nil {
		return
	}

	// Create edit that replaces all metadata for the performer
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.ID.String()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID.String())
	if err != nil {
		return
	}

	modifiedPerformer, _ := s.resolver.Query().FindPerformer(s.ctx, id)
	s.verifyApplyModifyPerformerEdit(*performerEditDetailsInput, modifiedPerformer, appliedEdit)
}

func (s *performerEditTestRunner) verifyApplyModifyPerformerEdit(input models.PerformerEditDetailsInput, updatedPerformer *models.Performer, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	s.verifyPerformerEdit(input, updatedPerformer)
}

func (s *performerEditTestRunner) testApplyModifyUnsetPerformerEdit() {
	performerData := s.createFullPerformerCreateInput()
	createdPerformer, err := s.createTestPerformer(performerData)
	if err != nil {
		return
	}
	id := createdPerformer.ID.String()

	measurements := models.MeasurementsInput{}
	performerUnsetInput := models.PerformerEditDetailsInput{
		Aliases:      []string{},
		Tattoos:      []*models.BodyModification{},
		Piercings:    []*models.BodyModification{},
		Urls:         []*models.URL{},
		Measurements: &measurements,
	}

	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, &performerUnsetInput, &editInput, nil)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID.String())
	if err != nil {
		return
	}

	modifiedPerformer, _ := s.resolver.Query().FindPerformer(s.ctx, id)
	s.verifyApplyModifyPerformerEdit(performerUnsetInput, modifiedPerformer, appliedEdit)
}

func (s *performerEditTestRunner) testApplyDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	performerID := createdPerformer.ID.String()
	appearance := models.PerformerAppearanceInput{
		PerformerID: performerID,
	}
	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{&appearance},
	}
	scene, _ := s.createTestScene(&sceneInput)

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(destroyEdit.ID.String())

	destroyedPerformer, _ := s.resolver.Query().FindPerformer(s.ctx, performerID)
	s.verifyApplyDestroyPerformerEdit(destroyedPerformer, appliedEdit, scene)
}

func (s *performerEditTestRunner) verifyApplyDestroyPerformerEdit(destroyedPerformer *models.Performer, edit *models.Edit, scene *models.Scene) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	if destroyedPerformer.Deleted != true {
		s.fieldMismatch(destroyedPerformer.Deleted, true, "Deleted")
	}

	scenePerformers, _ := s.resolver.Scene().Performers(s.ctx, scene)
	if len(scenePerformers) > 0 {
		s.fieldMismatch(len(scenePerformers), 0, "Scene performer count")
	}
}

func (s *performerEditTestRunner) testApplyMergePerformerEdit() {
	mergeSource1, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}
	mergeSource2, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}
	mergeTarget, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	mergeSource1Appearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource1.ID.String(),
	}
	mergeSource2Appearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource2.ID.String(),
	}
	mergeTargetAppearance := models.PerformerAppearanceInput{
		PerformerID: mergeTarget.ID.String(),
	}
	// Scene with performer from both source and target, should not cause db unique error
	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSource2Appearance,
			&mergeTargetAppearance,
		},
	}
	scene1, err := s.createTestScene(&sceneInput)
	if err != nil {
		return
	}

	sceneInput = models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSource1Appearance,
			&mergeSource2Appearance,
		},
	}
	scene2, err := s.createTestScene(&sceneInput)
	if err != nil {
		return
	}

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := mergeTarget.ID.String()
	mergeSources := []string{mergeSource1.ID.String(), mergeSource2.ID.String()}
	setMergeAliases := true
	options := models.PerformerEditOptionsInput{
		SetMergeAliases: &setMergeAliases,
	}

	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, &options)
	if err != nil {
		return
	}

	appliedMerge, err := s.applyEdit(mergeEdit.ID.String())
	if err != nil {
		return
	}

	s.verifyAppliedMergePerformerEdit(*performerEditDetailsInput, appliedMerge, scene1, scene2)
	// Target already attached, so should not get alias
	s.verifyPerformanceAlias(scene1, nil)
	s.verifyPerformanceAlias(scene2, &mergeSource1.Name)
}

func (s *performerEditTestRunner) verifyAppliedMergePerformerEdit(input models.PerformerEditDetailsInput, edit *models.Edit, scene1 *models.Scene, scene2 *models.Scene) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	s.verifyPerformerEditDetails(input, edit)

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		performer := merges[i].(*models.Performer)
		if performer.Deleted != true {
			s.fieldMismatch(performer.Deleted, true, "Deleted")
		}
	}

	editTarget := s.getEditPerformerTarget(edit)
	scene1Performers, _ := s.resolver.Scene().Performers(s.ctx, scene1)
	if len(scene1Performers) > 1 {
		s.fieldMismatch(len(scene1Performers), 1, "Scene 1 performer count")
	}
	if scene1Performers[0].Performer.ID != editTarget.ID {
		s.fieldMismatch(scene1Performers[0].Performer.ID, editTarget.ID, "Scene 1 performer ID")
	}

	scene2Performers, _ := s.resolver.Scene().Performers(s.ctx, scene2)
	if len(scene2Performers) > 1 {
		s.fieldMismatch(len(scene2Performers), 1, "Scene 2 performer count")
	}
	if scene2Performers[0].Performer.ID != editTarget.ID {
		s.fieldMismatch(scene2Performers[0].Performer.ID, editTarget.ID, "Scene 2 performer ID")
	}
}

func (s *performerEditTestRunner) verifyPerformanceAlias(scene *models.Scene, alias *string) {
	scenePerformers, _ := s.resolver.Scene().Performers(s.ctx, scene)
	if len(scenePerformers) > 1 {
		s.fieldMismatch(len(scenePerformers), 1, "Scene performer count")
	}
	if alias == nil {
		if scenePerformers[0].As != nil {
			s.fieldMismatch(scenePerformers[0].As, *alias, "Scene appearance alias")
		}
	} else if scenePerformers[0].As == nil {
		s.fieldMismatch(scenePerformers[0].As, *alias, "Scene appearance alias")
	} else if *alias != *scenePerformers[0].As {
		s.fieldMismatch(*scenePerformers[0].As, *alias, "Scene appearance alias")
	}
}

func (s *performerEditTestRunner) testApplyMergePerformerEditWithoutAlias() {
	mergeSource, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}
	mergeTarget, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	mergeSourceAppearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource.ID.String(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSourceAppearance,
		},
	}
	scene, err := s.createTestScene(&sceneInput)
	if err != nil {
		return
	}

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := mergeTarget.ID.String()
	mergeSources := []string{mergeSource.ID.String()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)
	if err != nil {
		return
	}

	_, err = s.applyEdit(mergeEdit.ID.String())
	if err != nil {
		return
	}

	s.verifyPerformanceAlias(scene, nil)
}

func TestCreatePerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testCreatePerformerEdit()
}

func TestModifyPerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testModifyPerformerEdit()
}

func TestDestroyPerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testDestroyPerformerEdit()
}

func TestMergePerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testMergePerformerEdit()
}

func TestApplyCreatePerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyCreatePerformerEdit()
}

func TestApplyModifyPerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyModifyPerformerEdit()
}

func TestApplyModifyPerformerEditWithoutAlias(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyMergePerformerEditWithoutAlias()
}

func TestApplyModifyUnsetPerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyModifyUnsetPerformerEdit()
}

func TestApplyDestroyPerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyDestroyPerformerEdit()
}

func TestApplyMergePerformerEdit(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyMergePerformerEdit()
}
