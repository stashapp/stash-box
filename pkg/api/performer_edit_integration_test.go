//go:build integration
// +build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gotest.tools/v3/assert"
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
	assert.NilError(s.t, err)
	s.verifyCreatedPerformerEdit(*performerEditDetailsInput, edit)
}

func (s *performerEditTestRunner) verifyCreatedPerformerEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)
}

func (s *performerEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NilError(s.t, err)

	editID := createdEdit.ID
	edit, err := s.resolver.Query().FindEdit(s.ctx, editID)
	assert.NilError(s.t, err, "Error finding edit: %s")
	assert.Assert(s.t, edit != nil, "Did not find edit by id")
}

func (s *performerEditTestRunner) testModifyPerformerEdit() {
	existingName := "performerName"

	existingBirthdate := "1990-01-02"
	existingDeathdate := "2024-11-22"
	performerCreateInput := models.PerformerCreateInput{
		Name:      existingName,
		Birthdate: &existingBirthdate,
		Deathdate: &existingDeathdate,
	}
	createdPerformer, err := s.createTestPerformer(&performerCreateInput)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	s.verifyUpdatedPerformerEdit(createdPerformer, *performerEditDetailsInput, createdUpdateEdit)
}

func (s *performerEditTestRunner) verifyUpdatedPerformerEdit(originalPerformer *performerOutput, input models.PerformerEditDetailsInput, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)
}

func (s *performerEditTestRunner) verifyPerformerEditDetails(input models.PerformerEditDetailsInput, edit *models.Edit) {
	performerDetails := s.getEditPerformerDetails(edit)

	c := fieldComparator{r: &s.testRunner}
	c.strPtrStrPtr(input.Name, performerDetails.Name, "Name")
	c.strPtrStrPtr(input.Disambiguation, performerDetails.Disambiguation, "Disambiguation")
	c.strPtrStrPtr(input.Birthdate, performerDetails.Birthdate, "Birthdate")
	c.strPtrStrPtr(input.Deathdate, performerDetails.Deathdate, "Deathdate")

	assert.DeepEqual(s.t, input.Aliases, performerDetails.AddedAliases)
	assert.Assert(s.t, input.Gender.IsValid() && (input.Gender.String() == *performerDetails.Gender))

	s.compareURLs(input.Urls, performerDetails.AddedUrls)

	assert.Assert(s.t, input.Ethnicity.IsValid() && (input.Ethnicity.String() == *performerDetails.Ethnicity))
	assert.Assert(s.t, input.Country != nil && (*input.Country == *performerDetails.Country))
	assert.Assert(s.t, input.EyeColor.IsValid() && (input.EyeColor.String() == *performerDetails.EyeColor))
	assert.Assert(s.t, input.HairColor.IsValid() && (input.HairColor.String() == *performerDetails.HairColor))
	assert.Assert(s.t, input.Height != nil && (int64(*input.Height) == *performerDetails.Height))
	assert.Assert(s.t, input.BandSize != nil && (int64(*input.BandSize) == *performerDetails.BandSize))
	assert.Assert(s.t, input.WaistSize != nil && (int64(*input.WaistSize) == *performerDetails.WaistSize))
	assert.Assert(s.t, input.HipSize != nil && (int64(*input.HipSize) == *performerDetails.HipSize))
	assert.Assert(s.t, input.CupSize != nil && (*input.CupSize == *performerDetails.CupSize))
	assert.Assert(s.t, input.BreastType.IsValid() && (input.BreastType.String() == *performerDetails.BreastType))
	assert.Assert(s.t, input.CareerStartYear != nil && (int64(*input.CareerStartYear) == *performerDetails.CareerStartYear))
	assert.Assert(s.t, input.CareerEndYear != nil && (int64(*input.CareerEndYear) == *performerDetails.CareerEndYear))
	assert.DeepEqual(s.t, input.Tattoos, performerDetails.AddedTattoos)
	assert.DeepEqual(s.t, input.Piercings, performerDetails.AddedPiercings)
	assert.DeepEqual(s.t, input.ImageIds, performerDetails.AddedImages)
}

func (s *performerEditTestRunner) verifyPerformerEdit(input models.PerformerEditDetailsInput, performer *models.Performer) {
	resolver := s.resolver.Performer()

	assert.Assert(s.t, input.Name == nil || (*input.Name == performer.Name))

	if input.Disambiguation == nil {
		assert.Assert(s.t, !performer.Disambiguation.Valid)
	} else {
		assert.Equal(s.t, *input.Disambiguation, performer.Disambiguation.String)
	}

	aliases, _ := resolver.Aliases(s.ctx, performer)
	if len(input.Aliases) == 0 {
		assert.Assert(s.t, len(aliases) == 0)
	} else {
		assert.DeepEqual(s.t, input.Aliases, aliases)
	}

	if input.Gender == nil {
		assert.Assert(s.t, !performer.Gender.Valid)
	} else {
		assert.Equal(s.t, input.Gender.String(), performer.Gender.String)
	}

	urls, _ := resolver.Urls(s.ctx, performer)
	s.compareURLs(input.Urls, urls)

	if input.Birthdate == nil {
		assert.Assert(s.t, !performer.Birthdate.Valid)
	} else {
		assert.Equal(s.t, *input.Birthdate, performer.Birthdate.String)
	}

	if input.Deathdate == nil {
		assert.Assert(s.t, !performer.Deathdate.Valid)
	} else {
		assert.Equal(s.t, *input.Deathdate, performer.Deathdate.String)
	}

	if input.Ethnicity == nil {
		assert.Assert(s.t, !performer.Ethnicity.Valid)
	} else {
		assert.Equal(s.t, input.Ethnicity.String(), performer.Ethnicity.String)
	}

	if input.Country == nil {
		assert.Assert(s.t, !performer.Country.Valid)
	} else {
		assert.Equal(s.t, *input.Country, performer.Country.String)
	}

	if input.EyeColor == nil {
		assert.Assert(s.t, !performer.EyeColor.Valid)
	} else {
		assert.Equal(s.t, input.EyeColor.String(), performer.EyeColor.String)
	}

	if input.HairColor == nil {
		assert.Assert(s.t, !performer.HairColor.Valid)
	} else {
		assert.Equal(s.t, input.HairColor.String(), performer.HairColor.String)
	}

	if input.Height == nil {
		assert.Assert(s.t, !performer.Height.Valid)
	} else {
		assert.Equal(s.t, int64(*input.Height), performer.Height.Int64)
	}

	if input.BandSize == nil {
		assert.Assert(s.t, !performer.BandSize.Valid)
	} else {
		assert.Equal(s.t, int64(*input.BandSize), performer.BandSize.Int64)
	}

	if input.CupSize == nil {
		assert.Assert(s.t, !performer.CupSize.Valid)
	} else {
		assert.Equal(s.t, *input.CupSize, performer.CupSize.String)
	}

	if input.WaistSize == nil {
		assert.Assert(s.t, !performer.WaistSize.Valid)
	} else {
		assert.Equal(s.t, int64(*input.WaistSize), performer.WaistSize.Int64)
	}

	if input.HipSize == nil {
		assert.Assert(s.t, !performer.HipSize.Valid)
	} else {
		assert.Equal(s.t, int64(*input.HipSize), performer.HipSize.Int64)
	}

	if input.BreastType == nil {
		assert.Assert(s.t, !performer.BreastType.Valid)
	} else {
		assert.Equal(s.t, input.BreastType.String(), performer.BreastType.String)
	}

	if input.CareerStartYear == nil {
		assert.Assert(s.t, !performer.CareerStartYear.Valid)
	} else {
		assert.Equal(s.t, int64(*input.CareerStartYear), performer.CareerStartYear.Int64)
	}

	if input.CareerEndYear == nil {
		assert.Assert(s.t, !performer.CareerEndYear.Valid)
	} else {
		assert.Equal(s.t, int64(*input.CareerEndYear), performer.CareerEndYear.Int64)
	}

	tattoos, _ := resolver.Tattoos(s.ctx, performer)
	if len(input.Tattoos) == 0 {
		assert.Assert(s.t, len(tattoos) == 0)
	} else {
		assert.DeepEqual(s.t, input.Tattoos, tattoos)
	}

	piercings, _ := resolver.Piercings(s.ctx, performer)
	if len(input.Piercings) == 0 {
		assert.Assert(s.t, len(piercings) == 0)
	} else {
		assert.DeepEqual(s.t, input.Piercings, piercings)
	}

	images, _ := resolver.Images(s.ctx, performer)
	var imageIds []uuid.UUID
	for _, image := range images {
		imageIds = append(imageIds, image.ID)
	}
	assert.DeepEqual(s.t, input.ImageIds, imageIds)
}

func (s *performerEditTestRunner) testDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performerID := createdPerformer.UUID()

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	s.verifyDestroyPerformerEdit(performerID, destroyEdit)
}

func (s *performerEditTestRunner) verifyDestroyPerformerEdit(performerID uuid.UUID, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditPerformerTarget(edit)

	assert.Equal(s.t, performerID, editTarget.ID)
}

func (s *performerEditTestRunner) testMergePerformerEdit() {
	existingName := "performerName2"
	existingAlias := "performerAlias2"
	performerCreateInput := models.PerformerCreateInput{
		Name:    existingName,
		Aliases: []string{existingAlias},
	}
	createdPrimaryPerformer, err := s.createTestPerformer(&performerCreateInput)
	assert.NilError(s.t, err)

	createdMergePerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPrimaryPerformer.UUID()
	mergeSources := []uuid.UUID{createdMergePerformer.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	s.verifyMergePerformerEdit(createdPrimaryPerformer, *performerEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *performerEditTestRunner) verifyMergePerformerEdit(originalPerformer *performerOutput, input models.PerformerEditDetailsInput, edit *models.Edit, inputMergeSources []uuid.UUID) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)

	var mergeSources []uuid.UUID
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Performer)
		mergeSources = append(mergeSources, merge.ID)
	}
	assert.DeepEqual(s.t, inputMergeSources, mergeSources)
}

func (s *performerEditTestRunner) testApplyCreatePerformerEdit() {
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NilError(s.t, err)
	s.verifyAppliedPerformerCreateEdit(*performerEditDetailsInput, appliedEdit)
}

func (s *performerEditTestRunner) verifyAppliedPerformerCreateEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	performer := s.getEditPerformerTarget(edit)
	s.verifyPerformerEdit(input, performer)
}

func (s *performerEditTestRunner) testApplyModifyPerformerEdit() {
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

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
		Urls: []*models.URLInput{
			{
				URL:    "http://example.org/asd",
				SiteID: site.ID,
			},
		},
	}
	createdPerformer, err := s.createTestPerformer(&performerCreateInput)
	assert.NilError(s.t, err)

	// Create edit that replaces all metadata for the performer
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	modifiedPerformer, _ := s.resolver.Query().FindPerformer(s.ctx, id)

	s.verifyAppliedPerformerEdit(appliedEdit)
	s.verifyPerformerEdit(*performerEditDetailsInput, modifiedPerformer)
}

func (s *performerEditTestRunner) testApplyModifyPerformerWithoutAliases() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	sceneAppearance := models.PerformerAppearanceInput{
		PerformerID: createdPerformer.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&sceneAppearance,
		},
		Date: "2020-01-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, nil)

	performer, err := s.client.findPerformer(id)
	assert.NilError(s.t, err, "Error finding performer")

	performerEditDetailsInput = s.createPerformerEditDetailsInput()
	editInput = models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	aliasVal := true
	options := models.PerformerEditOptionsInput{
		SetModifyAliases: &aliasVal,
	}

	createdUpdateEdit, err = s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, &options)
	assert.NilError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	// set modify aliases was set to true - this should be set to the old name
	s.verifyPerformanceAlias(scene, &performer.Name)
}

func (s *performerEditTestRunner) testApplyModifyPerformerWithAliases() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	sceneAppearance := models.PerformerAppearanceInput{
		PerformerID: createdPerformer.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&sceneAppearance,
		},
		Date: "2020-01-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	aliasVal := true
	options := models.PerformerEditOptionsInput{
		SetModifyAliases: &aliasVal,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, &options)
	assert.NilError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, &createdPerformer.Name)
}

func (s *performerEditTestRunner) testApplyModifyUnsetPerformerEdit() {
	performerData := s.createFullPerformerCreateInput()
	createdPerformer, err := s.createTestPerformer(performerData)
	assert.NilError(s.t, err)

	id := createdPerformer.UUID()

	var resp struct {
		PerformerEdit struct {
			ID string
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		mutation {
			performerEdit(input: {
				edit: {id: "%v", operation: MODIFY}
				details: { aliases: [], tattoos: [], piercings: [], urls: [], disambiguation: null }
			}) {
				id
			}
		}
	`, id), &resp)

	edit, _ := s.applyEdit(uuid.FromStringOrNil(resp.PerformerEdit.ID))
	s.verifyAppliedPerformerEdit(edit)

	var performer struct {
		FindPerformer struct {
			Height         int
			ID             string
			Disambiguation string
			Aliases        []string
			URLs           []models.URL
			Piercings      []models.BodyModification
			Tattoos        []models.BodyModification
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			findPerformer(id: "%v") {
				disambiguation
				height
				aliases
				urls {
					url
				}
				piercings {
					location
				}
				tattoos {
					location
				}
			}
		}
	`, id), &performer)

	assert.Equal(s.t, performer.FindPerformer.Disambiguation, "")
	assert.Equal(s.t, performer.FindPerformer.Height, *performerData.Height)
	assert.Check(s.t, len(performer.FindPerformer.Aliases) == 0)
	assert.Check(s.t, len(performer.FindPerformer.URLs) == 0)
	assert.Check(s.t, len(performer.FindPerformer.Piercings) == 0)
	assert.Check(s.t, len(performer.FindPerformer.Tattoos) == 0)
}

func (s *performerEditTestRunner) testApplyDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performerID := createdPerformer.UUID()
	appearance := models.PerformerAppearanceInput{
		PerformerID: performerID,
	}
	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{&appearance},
		Date:       "2020-03-02",
	}
	scene, _ := s.createTestScene(&sceneInput)

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(destroyEdit.ID)
	assert.NilError(s.t, err)

	destroyedPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyApplyDestroyPerformerEdit(destroyedPerformer, appliedEdit, scene)
}

func (s *performerEditTestRunner) verifyApplyDestroyPerformerEdit(destroyedPerformer *models.Performer, edit *models.Edit, scene *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	assert.Assert(s.t, destroyedPerformer.Deleted, true)

	scenePerformers := scene.Performers
	assert.Assert(s.t, len(scenePerformers) == 0)
}

func (s *performerEditTestRunner) testApplyMergePerformerEdit() {
	mergeSource1, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	mergeSource2, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	mergeTarget, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	mergeSource1Appearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource1.UUID(),
	}
	mergeSource2Appearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource2.UUID(),
	}
	mergeTargetAppearance := models.PerformerAppearanceInput{
		PerformerID: mergeTarget.UUID(),
	}
	// Scene with performer from both source and target, should not cause db unique error
	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSource2Appearance,
			&mergeTargetAppearance,
		},
		Date: "2020-02-03",
	}
	scene1, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	sceneInput = models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSource1Appearance,
			&mergeSource2Appearance,
		},
		Date: "2020-03-02",
	}
	scene2, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	mergeSources := []uuid.UUID{
		mergeSource1.UUID(),
		mergeSource2.UUID(),
	}
	setMergeAliases := true
	options := models.PerformerEditOptionsInput{
		SetMergeAliases: &setMergeAliases,
	}

	id := mergeTarget.UUID()
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, &options)
	assert.NilError(s.t, err)

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	assert.NilError(s.t, err)

	scene1, err = s.client.findScene(scene1.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	scene2, err = s.client.findScene(scene2.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyAppliedMergePerformerEdit(*performerEditDetailsInput, appliedMerge, scene1, scene2)
	// Target already attached, so should not get alias
	s.verifyPerformanceAlias(scene1, nil)
	s.verifyPerformanceAlias(scene2, &mergeSource1.Name)
}

func (s *performerEditTestRunner) verifyAppliedMergePerformerEdit(input models.PerformerEditDetailsInput, edit *models.Edit, scene1 *sceneOutput, scene2 *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	s.verifyPerformerEditDetails(input, edit)

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		performer := merges[i].(*models.Performer)
		assert.Assert(s.t, performer.Deleted == true)
	}

	editTarget := s.getEditPerformerTarget(edit)
	scene1Performers := scene1.Performers
	assert.Assert(s.t, len(scene1Performers) == 1)
	assert.Equal(s.t, scene1Performers[0].Performer.ID, editTarget.ID.String())

	scene2Performers := scene2.Performers
	assert.Assert(s.t, len(scene2Performers) == 1)
	assert.Equal(s.t, scene2Performers[0].Performer.ID, editTarget.ID.String())
}

func (s *performerEditTestRunner) verifyPerformanceAlias(scene *sceneOutput, alias *string) {
	scenePerformers := scene.Performers
	assert.Assert(s.t, len(scenePerformers) == 1)

	if alias == nil {
		assert.Assert(s.t, len(scenePerformers) == 0 || scenePerformers[0].As == nil)
	} else {
		assert.Assert(s.t, scenePerformers[0].As != nil)
		assert.Assert(s.t, *alias == *scenePerformers[0].As)
	}
}

func (s *performerEditTestRunner) testApplyMergePerformerEditWithoutAlias() {
	mergeSource, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	mergeTarget, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	mergeSourceAppearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&mergeSourceAppearance,
		},
		Date: "2020-03-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := mergeTarget.UUID()
	mergeSources := []uuid.UUID{mergeSource.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)
	assert.NilError(s.t, err)

	_, err = s.applyEdit(mergeEdit.ID)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, nil)
}

func (s *performerTestRunner) testChangeURLSite() {
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	input := &models.PerformerCreateInput{
		Name: s.generatePerformerName(),
		Urls: []*models.URLInput{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
	}

	createdPerformer, err := s.createTestPerformer(input)

	siteTwo, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	updateInput := &models.PerformerEditDetailsInput{
		Urls: []*models.URLInput{
			{
				URL:    "URL",
				SiteID: siteTwo.ID,
			},
		},
	}
	id := uuid.FromStringOrNil(createdPerformer.ID)
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	modifyEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, updateInput, &editInput, nil)
	assert.NilError(s.t, err)

	_, err = s.applyEdit(modifyEdit.ID)
	assert.NilError(s.t, err)

	performer, _ := s.resolver.Query().FindPerformer(s.ctx, id)
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	if !compareUrls(updateInput.Urls, urls) {
		s.fieldMismatch(updateInput.Urls, urls, "Urls")
	}
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

func TestApplyModifyPerformerEditOptions(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testApplyModifyPerformerWithAliases()
	pt.testApplyModifyPerformerWithoutAliases()
}

func TestApplyMergePerformerEditWithoutAlias(t *testing.T) {
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

func TestChangeURLSite(t *testing.T) {
	pt := createPerformerTestRunner(t)
	pt.testChangeURLSite()
}
