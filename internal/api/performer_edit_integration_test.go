//go:build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type performerEditTestRunner struct {
	testRunner
}

func contains(slice []uuid.UUID, item uuid.UUID) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func createPerformerEditTestRunner(t *testing.T) *performerEditTestRunner {
	return &performerEditTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *performerEditTestRunner) compareBodyModifications(input []models.BodyModificationInput, actual []models.BodyModification) {
	assert.Equal(s.t, len(input), len(actual))
	for i, inp := range input {
		assert.Equal(s.t, inp.Location, actual[i].Location)
		if inp.Description == nil {
			assert.Nil(s.t, actual[i].Description)
		} else {
			assert.Equal(s.t, *inp.Description, *actual[i].Description)
		}
	}
}

func (s *performerEditTestRunner) testCreatePerformerEdit() {
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	assert.NoError(s.t, err)
	s.verifyCreatedPerformerEdit(*performerEditDetailsInput, edit)
}

func (s *performerEditTestRunner) verifyCreatedPerformerEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	assert.True(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifyPerformerEditDetails(input, edit)
}

func (s *performerEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, nil, nil, nil)
	assert.NoError(s.t, err)

	editID := createdEdit.ID
	edit, err := s.resolver.Query().FindEdit(s.ctx, editID)
	assert.NoError(s.t, err, "Error finding edit: %s")
	assert.NotNil(s.t, edit, "Did not find edit by id")
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
	assert.NoError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

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

	assert.Equal(s.t, input.Aliases, performerDetails.AddedAliases)

	if input.Gender == nil {
		assert.Nil(s.t, performerDetails.Gender)
	} else {
		assert.True(s.t, input.Gender.IsValid() && (input.Gender.String() == *performerDetails.Gender))
	}

	assert.Equal(s.t, input.Urls, performerDetails.AddedUrls)

	if input.Ethnicity == nil {
		assert.Nil(s.t, performerDetails.Ethnicity)
	} else {
		assert.True(s.t, input.Ethnicity.IsValid() && (input.Ethnicity.String() == *performerDetails.Ethnicity))
	}

	if input.Country == nil {
		assert.Nil(s.t, performerDetails.Country)
	} else {
		assert.True(s.t, *input.Country == *performerDetails.Country)
	}

	if input.EyeColor == nil {
		assert.Nil(s.t, performerDetails.EyeColor)
	} else {
		assert.True(s.t, input.EyeColor.IsValid() && (input.EyeColor.String() == *performerDetails.EyeColor))
	}

	if input.HairColor == nil {
		assert.Nil(s.t, performerDetails.HairColor)
	} else {
		assert.True(s.t, input.HairColor.IsValid() && (input.HairColor.String() == *performerDetails.HairColor))
	}

	if input.Height == nil {
		assert.Nil(s.t, performerDetails.Height)
	} else {
		assert.True(s.t, *input.Height == *performerDetails.Height)
	}

	if input.BandSize == nil {
		assert.Nil(s.t, performerDetails.BandSize)
	} else {
		assert.True(s.t, *input.BandSize == *performerDetails.BandSize)
	}

	if input.WaistSize == nil {
		assert.Nil(s.t, performerDetails.WaistSize)
	} else {
		assert.True(s.t, *input.WaistSize == *performerDetails.WaistSize)
	}

	if input.HipSize == nil {
		assert.Nil(s.t, performerDetails.HipSize)
	} else {
		assert.True(s.t, *input.HipSize == *performerDetails.HipSize)
	}

	if input.CupSize == nil {
		assert.Nil(s.t, performerDetails.CupSize)
	} else {
		assert.True(s.t, *input.CupSize == *performerDetails.CupSize)
	}

	if input.BreastType == nil {
		assert.Nil(s.t, performerDetails.BreastType)
	} else {
		assert.True(s.t, input.BreastType.IsValid() && (input.BreastType.String() == *performerDetails.BreastType))
	}

	if input.CareerStartYear == nil {
		assert.Nil(s.t, performerDetails.CareerStartYear)
	} else {
		assert.True(s.t, *input.CareerStartYear == *performerDetails.CareerStartYear)
	}

	if input.CareerEndYear == nil {
		assert.Nil(s.t, performerDetails.CareerEndYear)
	} else {
		assert.True(s.t, *input.CareerEndYear == *performerDetails.CareerEndYear)
	}
	s.compareBodyModifications(input.Tattoos, performerDetails.AddedTattoos)
	s.compareBodyModifications(input.Piercings, performerDetails.AddedPiercings)
	assert.Equal(s.t, input.ImageIds, performerDetails.AddedImages)
}

func (s *performerEditTestRunner) verifyPerformerEdit(input models.PerformerEditDetailsInput, performer *models.Performer) {
	resolver := s.resolver.Performer()

	assert.True(s.t, input.Name == nil || (*input.Name == performer.Name))

	if input.Disambiguation == nil {
		assert.Nil(s.t, performer.Disambiguation)
	} else {
		assert.Equal(s.t, *input.Disambiguation, *performer.Disambiguation)
	}

	aliases, _ := resolver.Aliases(s.ctx, performer)
	if len(input.Aliases) == 0 {
		assert.True(s.t, len(aliases) == 0)
	} else {
		assert.Equal(s.t, input.Aliases, aliases)
	}

	if input.Gender == nil {
		assert.Nil(s.t, performer.Gender)
	} else {
		assert.Equal(s.t, input.Gender.String(), performer.Gender.String())
	}

	urls, _ := resolver.Urls(s.ctx, performer)
	assert.Equal(s.t, input.Urls, urls)

	if input.Birthdate == nil {
		assert.Nil(s.t, performer.BirthDate)
	} else {
		assert.Equal(s.t, *input.Birthdate, *performer.BirthDate)
	}

	if input.Deathdate == nil {
		assert.Nil(s.t, performer.DeathDate)
	} else {
		assert.Equal(s.t, *input.Deathdate, *performer.DeathDate)
	}

	if input.Ethnicity == nil {
		assert.Nil(s.t, performer.Ethnicity)
	} else {
		assert.Equal(s.t, input.Ethnicity.String(), performer.Ethnicity.String())
	}

	if input.Country == nil {
		assert.Nil(s.t, performer.Country)
	} else {
		assert.Equal(s.t, *input.Country, *performer.Country)
	}

	if input.EyeColor == nil {
		assert.Nil(s.t, performer.EyeColor)
	} else {
		assert.Equal(s.t, input.EyeColor.String(), performer.EyeColor.String())
	}

	if input.HairColor == nil {
		assert.Nil(s.t, performer.HairColor)
	} else {
		assert.Equal(s.t, input.HairColor.String(), performer.HairColor.String())
	}

	if input.Height == nil {
		assert.Nil(s.t, performer.Height)
	} else {
		assert.Equal(s.t, *input.Height, *performer.Height)
	}

	if input.BandSize == nil {
		assert.Nil(s.t, performer.BandSize)
	} else {
		assert.Equal(s.t, *input.BandSize, *performer.BandSize)
	}

	if input.CupSize == nil {
		assert.Nil(s.t, performer.CupSize)
	} else {
		assert.Equal(s.t, *input.CupSize, *performer.CupSize)
	}

	if input.WaistSize == nil {
		assert.Nil(s.t, performer.WaistSize)
	} else {
		assert.Equal(s.t, *input.WaistSize, *performer.WaistSize)
	}

	if input.HipSize == nil {
		assert.Nil(s.t, performer.HipSize)
	} else {
		assert.Equal(s.t, *input.HipSize, *performer.HipSize)
	}

	if input.BreastType == nil {
		assert.Nil(s.t, performer.BreastType)
	} else {
		assert.Equal(s.t, input.BreastType.String(), performer.BreastType.String())
	}

	if input.CareerStartYear == nil {
		assert.Nil(s.t, performer.CareerStartYear)
	} else {
		assert.Equal(s.t, *input.CareerStartYear, *performer.CareerStartYear)
	}

	if input.CareerEndYear == nil {
		assert.Nil(s.t, performer.CareerEndYear)
	} else {
		assert.Equal(s.t, *input.CareerEndYear, *performer.CareerEndYear)
	}

	tattoos, _ := resolver.Tattoos(s.ctx, performer)
	if len(input.Tattoos) == 0 {
		assert.True(s.t, len(tattoos) == 0)
	} else {
		s.compareBodyModifications(input.Tattoos, tattoos)
	}

	piercings, _ := resolver.Piercings(s.ctx, performer)
	if len(input.Piercings) == 0 {
		assert.True(s.t, len(piercings) == 0)
	} else {
		s.compareBodyModifications(input.Piercings, piercings)
	}

	images, _ := resolver.Images(s.ctx, performer)
	var imageIds []uuid.UUID
	for _, image := range images {
		imageIds = append(imageIds, image.ID)
	}
	assert.Equal(s.t, input.ImageIds, imageIds)
}

func (s *performerEditTestRunner) testDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performerID := createdPerformer.UUID()

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	createdMergePerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPrimaryPerformer.UUID()
	mergeSources := []uuid.UUID{createdMergePerformer.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

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
	assert.Equal(s.t, inputMergeSources, mergeSources)
}

func (s *performerEditTestRunner) testApplyCreatePerformerEdit() {
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NoError(s.t, err)
	s.verifyAppliedPerformerCreateEdit(*performerEditDetailsInput, appliedEdit)
}

func (s *performerEditTestRunner) verifyAppliedPerformerCreateEdit(input models.PerformerEditDetailsInput, edit *models.Edit) {
	assert.True(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	performer := s.getEditPerformerTarget(edit)
	s.verifyPerformerEdit(input, performer)
}

func (s *performerEditTestRunner) testApplyModifyPerformerEdit() {
	site, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	performerCreateInput := models.PerformerCreateInput{
		Name:    "performerName3",
		Aliases: []string{"modfied performer alias"},
		Tattoos: []models.BodyModificationInput{
			{
				Location: "some tattoo location",
			},
		},
		Piercings: []models.BodyModificationInput{
			{
				Location: "some piercing location",
			},
		},
		Urls: []models.URL{
			{
				URL:    "http://example.org/asd",
				SiteID: site.ID,
			},
		},
	}
	createdPerformer, err := s.createTestPerformer(&performerCreateInput)
	assert.NoError(s.t, err)

	// Create edit that replaces all metadata for the performer
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	assert.NoError(s.t, err)

	modifiedPerformer, _ := s.resolver.Query().FindPerformer(s.ctx, id)

	s.verifyAppliedPerformerEdit(appliedEdit)
	s.verifyPerformerEdit(*performerEditDetailsInput, modifiedPerformer)
}

func (s *performerEditTestRunner) testApplyModifyPerformerWithoutAliases() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	sceneAppearance := models.PerformerAppearanceInput{
		PerformerID: createdPerformer.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []models.PerformerAppearanceInput{
			sceneAppearance,
		},
		Date: "2020-01-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NoError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := createdPerformer.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestPerformerEdit(models.OperationEnumModify, performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NoError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, nil)

	performer, err := s.client.findPerformer(id)
	assert.NoError(s.t, err, "Error finding performer")

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
	assert.NoError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NoError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	// set modify aliases was set to true - this should be set to the old name
	s.verifyPerformanceAlias(scene, &performer.Name)
}

func (s *performerEditTestRunner) testApplyModifyPerformerWithAliases() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	sceneAppearance := models.PerformerAppearanceInput{
		PerformerID: createdPerformer.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []models.PerformerAppearanceInput{
			sceneAppearance,
		},
		Date: "2020-01-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	_, err = s.applyEdit(createdUpdateEdit.ID)
	assert.NoError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, &createdPerformer.Name)
}

func (s *performerEditTestRunner) testApplyModifyUnsetPerformerEdit() {
	performerData := s.createFullPerformerCreateInput()
	createdPerformer, err := s.createTestPerformer(performerData)
	assert.NoError(s.t, err)

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
	assert.True(s.t, len(performer.FindPerformer.Aliases) == 0)
	assert.True(s.t, len(performer.FindPerformer.URLs) == 0)
	assert.True(s.t, len(performer.FindPerformer.Piercings) == 0)
	assert.True(s.t, len(performer.FindPerformer.Tattoos) == 0)
}

func (s *performerEditTestRunner) testApplyDestroyPerformerEdit() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performerID := createdPerformer.UUID()
	appearance := models.PerformerAppearanceInput{
		PerformerID: performerID,
	}
	sceneInput := models.SceneCreateInput{
		Performers: []models.PerformerAppearanceInput{appearance},
		Date:       "2020-03-02",
	}
	scene, _ := s.createTestScene(&sceneInput)

	performerEditDetailsInput := models.PerformerEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &performerID,
	}
	destroyEdit, err := s.createTestPerformerEdit(models.OperationEnumDestroy, &performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

	appliedEdit, err := s.applyEdit(destroyEdit.ID)
	assert.NoError(s.t, err)

	destroyedPerformer, err := s.resolver.Query().FindPerformer(s.ctx, performerID)
	assert.NoError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	s.verifyApplyDestroyPerformerEdit(destroyedPerformer, appliedEdit, scene)
}

func (s *performerEditTestRunner) verifyApplyDestroyPerformerEdit(destroyedPerformer *models.Performer, edit *models.Edit, scene *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumPerformer.String(), edit)
	s.verifyEditApplication(true, edit)

	assert.True(s.t, destroyedPerformer.Deleted, true)

	scenePerformers := scene.Performers
	assert.True(s.t, len(scenePerformers) == 0)
}

func (s *performerEditTestRunner) testApplyMergePerformerEdit() {
	mergeSource1, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	mergeSource2, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	mergeTarget, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

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
		Performers: []models.PerformerAppearanceInput{
			mergeSource2Appearance,
			mergeTargetAppearance,
		},
		Date: "2020-02-03",
	}
	scene1, err := s.createTestScene(&sceneInput)
	assert.NoError(s.t, err)

	sceneInput = models.SceneCreateInput{
		Performers: []models.PerformerAppearanceInput{
			mergeSource1Appearance,
			mergeSource2Appearance,
		},
		Date: "2020-03-02",
	}
	scene2, err := s.createTestScene(&sceneInput)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	assert.NoError(s.t, err)

	scene1, err = s.client.findScene(scene1.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	scene2, err = s.client.findScene(scene2.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	s.verifyAppliedMergePerformerEdit(*performerEditDetailsInput, appliedMerge, scene1, scene2)
	// Target already attached, so should not get alias
	s.verifyPerformanceAlias(scene1, nil)
	s.verifyPerformanceAlias(scene2, &mergeSource1.Name)

	// Verify merged_ids and merged_into_id fields
	targetPerformer, err := s.resolver.Query().FindPerformer(s.ctx, mergeTarget.UUID())
	assert.NoError(s.t, err)

	mergedIds, err := s.resolver.Performer().MergedIds(s.ctx, targetPerformer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 2, len(mergedIds), "Target should have 2 performers merged into it")
	assert.True(s.t, contains(mergedIds, mergeSource1.UUID()), "Target should contain source1 in merged_ids")
	assert.True(s.t, contains(mergedIds, mergeSource2.UUID()), "Target should contain source2 in merged_ids")

	mergedIntoID, err := s.resolver.Performer().MergedIntoID(s.ctx, targetPerformer)
	assert.NoError(s.t, err)
	assert.Nil(s.t, mergedIntoID, "Target performer should not be merged into anything")

	source1Performer, err := s.resolver.Query().FindPerformer(s.ctx, mergeSource1.UUID())
	assert.NoError(s.t, err)

	source1MergedIds, err := s.resolver.Performer().MergedIds(s.ctx, source1Performer)
	assert.NoError(s.t, err)
	assert.Equal(s.t, 0, len(source1MergedIds), "Source performer should have no performers merged into it")

	source1MergedIntoID, err := s.resolver.Performer().MergedIntoID(s.ctx, source1Performer)
	assert.NoError(s.t, err)
	assert.NotNil(s.t, source1MergedIntoID, "Source performer should be merged into target")
	assert.Equal(s.t, mergeTarget.UUID(), *source1MergedIntoID, "Source should be merged into target")
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
		assert.True(s.t, performer.Deleted == true)
	}

	editTarget := s.getEditPerformerTarget(edit)
	scene1Performers := scene1.Performers
	assert.True(s.t, len(scene1Performers) == 1)
	assert.Equal(s.t, scene1Performers[0].Performer.ID, editTarget.ID.String())

	scene2Performers := scene2.Performers
	assert.True(s.t, len(scene2Performers) == 1)
	assert.Equal(s.t, scene2Performers[0].Performer.ID, editTarget.ID.String())
}

func (s *performerEditTestRunner) verifyPerformanceAlias(scene *sceneOutput, alias *string) {
	scenePerformers := scene.Performers
	assert.True(s.t, len(scenePerformers) == 1)

	if alias == nil {
		assert.True(s.t, len(scenePerformers) == 0 || scenePerformers[0].As == nil)
	} else {
		assert.NotNil(s.t, scenePerformers[0].As)
		assert.True(s.t, *alias == *scenePerformers[0].As)
	}
}

func (s *performerEditTestRunner) testApplyMergePerformerEditWithoutAlias() {
	mergeSource, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	mergeTarget, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	mergeSourceAppearance := models.PerformerAppearanceInput{
		PerformerID: mergeSource.UUID(),
	}

	sceneInput := models.SceneCreateInput{
		Performers: []models.PerformerAppearanceInput{
			mergeSourceAppearance,
		},
		Date: "2020-03-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NoError(s.t, err)

	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	id := mergeTarget.UUID()
	mergeSources := []uuid.UUID{mergeSource.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestPerformerEdit(models.OperationEnumMerge, performerEditDetailsInput, &editInput, nil)
	assert.NoError(s.t, err)

	_, err = s.applyEdit(mergeEdit.ID)
	assert.NoError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	s.verifyPerformanceAlias(scene, nil)
}

func (s *performerTestRunner) testChangeURLSite() {
	site, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	input := &models.PerformerCreateInput{
		Name: s.generatePerformerName(),
		Urls: []models.URL{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
	}

	createdPerformer, err := s.createTestPerformer(input)

	siteTwo, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	updateInput := &models.PerformerEditDetailsInput{
		Urls: []models.URL{
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
	assert.NoError(s.t, err)

	_, err = s.applyEdit(modifyEdit.ID)
	assert.NoError(s.t, err)

	performer, _ := s.resolver.Query().FindPerformer(s.ctx, id)
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	assert.Equal(s.t, updateInput.Urls, urls)
}

func (s *performerEditTestRunner) testPerformerEditUpdate() {
	// Create a pending edit with initial details
	performerEditDetailsInput := s.createPerformerEditDetailsInput()
	createdEdit, err := s.createTestPerformerEdit(models.OperationEnumCreate, performerEditDetailsInput, nil, nil)
	assert.NoError(s.t, err)

	// Verify initial state
	assert.Equal(s.t, 0, createdEdit.UpdateCount, "Initial update_count should be 0")
	assert.Nil(s.t, createdEdit.UpdatedAt, "Initial updated timestamp should be nil")

	// Update the edit with new details
	newName := "Updated Performer Name"
	newGender := models.GenderEnumMale
	newBirthdate := "1995-06-15"
	newHeight := 175
	updatedDetails := models.PerformerEditDetailsInput{
		Name:      &newName,
		Gender:    &newGender,
		Birthdate: &newBirthdate,
		Height:    &newHeight,
	}

	editID := createdEdit.ID
	updatedEdit, err := s.resolver.Mutation().PerformerEditUpdate(s.ctx, createdEdit.ID, models.PerformerEditInput{
		Edit:    &models.EditInput{Operation: models.OperationEnumCreate},
		Details: &updatedDetails,
	})
	assert.NoError(s.t, err, "Error updating performer edit")

	// Verify basic properties
	assert.Equal(s.t, createdEdit.ID, updatedEdit.ID, "Edit ID should not change")
	assert.NotNil(s.t, updatedEdit, "Updated edit should not be nil")

	// Verify update_count was incremented
	assert.Equal(s.t, 1, updatedEdit.UpdateCount, "update_count should be incremented to 1")

	// Verify updated timestamp is set
	assert.NotNil(s.t, updatedEdit.UpdatedAt, "updated timestamp should be set after update")

	// Verify edit is still pending (not applied)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), updatedEdit)
	s.verifyEditApplication(false, updatedEdit)

	// Verify the new details are persisted
	s.verifyPerformerEditDetails(updatedDetails, updatedEdit)

	// Re-fetch the edit from the database to ensure persistence
	refetchedEdit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NoError(s.t, err, "Error re-fetching edit")
	assert.Equal(s.t, 1, refetchedEdit.UpdateCount, "update_count should persist in database")
	s.verifyPerformerEditDetails(updatedDetails, refetchedEdit)

	// Attempt to update the edit again - should fail due to update limit
	secondUpdateName := "Second Update Name"
	secondUpdatedDetails := models.PerformerEditDetailsInput{
		Name:      &secondUpdateName,
		Gender:    &newGender,
		Birthdate: &newBirthdate,
		Height:    &newHeight,
	}

	_, err = s.resolver.Mutation().PerformerEditUpdate(s.ctx, createdEdit.ID, models.PerformerEditInput{
		Edit:    &models.EditInput{ID: &editID, Operation: models.OperationEnumCreate},
		Details: &secondUpdatedDetails,
	})

	// Verify that the update limit error is returned
	assert.ErrorContains(s.t, err, "edit update limit reached")
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

func TestPerformerEditUpdate(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testPerformerEditUpdate()
}

func (s *performerEditTestRunner) testQueryExistingPerformer() {
	// Create a performer edit for testing
	site, err := s.createTestSite(nil)
	assert.NoError(s.t, err)

	performerName := "Test Performer Name"
	performerDisambiguation := "Test Disambiguation"
	testURL := "http://example.com/performer123"

	performerEditDetailsInput := models.PerformerEditDetailsInput{
		Name:           &performerName,
		Disambiguation: &performerDisambiguation,
		Urls: []models.URL{
			{
				URL:    testURL,
				SiteID: site.ID,
			},
		},
	}

	edit, err := s.createTestPerformerEdit(models.OperationEnumCreate, &performerEditDetailsInput, nil, nil)
	assert.NoError(s.t, err)

	// Test 1: Query by URL - should find the edit
	var resp1 struct {
		QueryExistingPerformer struct {
			Edits []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				urls: ["%v"]
			}) {
				edits {
					id
				}
			}
		}
	`, testURL), &resp1)
	assert.True(s.t, len(resp1.QueryExistingPerformer.Edits) > 0, "Should find edit by URL")

	// Test 2: Query by name and disambiguation - should find the edit
	var resp2 struct {
		QueryExistingPerformer struct {
			Edits []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				name: "%v"
				disambiguation: "%v"
				urls: []
			}) {
				edits {
					id
				}
			}
		}
	`, performerName, performerDisambiguation), &resp2)
	assert.True(s.t, len(resp2.QueryExistingPerformer.Edits) > 0, "Should find edit by name and disambiguation")

	// Test 3: Cancel the edit and verify it no longer appears
	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{
		ID: edit.ID,
	})
	assert.NoError(s.t, err)

	var resp3 struct {
		QueryExistingPerformer struct {
			Edits []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				urls: ["%v"]
			}) {
				edits {
					id
				}
			}
		}
	`, testURL), &resp3)
	assert.True(s.t, len(resp3.QueryExistingPerformer.Edits) == 0, "Should not find cancelled edit")

	// Test 4: Create an actual performer (without disambiguation) and verify it appears in results
	performerName2 := "Test Performer Name 2"
	testURL2 := "http://example.com/performer456"
	actualPerformerInput := models.PerformerCreateInput{
		Name: performerName2,
		Urls: []models.URL{
			{
				URL:    testURL2,
				SiteID: site.ID,
			},
		},
	}
	createdPerformer, err := s.createTestPerformer(&actualPerformerInput)
	assert.NoError(s.t, err)

	// Query by name only (works because performer has no disambiguation)
	var resp4 struct {
		QueryExistingPerformer struct {
			Performers []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				name: "%v"
				urls: []
			}) {
				performers {
					id
				}
			}
		}
	`, performerName2), &resp4)
	assert.True(s.t, len(resp4.QueryExistingPerformer.Performers) > 0, "Should find created performer by name")
	assert.Equal(s.t, createdPerformer.ID, resp4.QueryExistingPerformer.Performers[0].ID, "Should return the correct performer")

	// Test 5: Query by URL for the created performer
	var resp5 struct {
		QueryExistingPerformer struct {
			Performers []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				urls: ["%v"]
			}) {
				performers {
					id
				}
			}
		}
	`, testURL2), &resp5)
	assert.True(s.t, len(resp5.QueryExistingPerformer.Performers) > 0, "Should find created performer by URL")
	assert.Equal(s.t, createdPerformer.ID, resp5.QueryExistingPerformer.Performers[0].ID, "Should return the correct performer by URL")

	// Test 6: Create a performer WITH disambiguation and query with matching disambiguation
	performerName3 := "Test Performer Name 3"
	performerDisambiguation3 := "Test Disambiguation 3"
	testURL3 := "http://example.com/performer789"
	actualPerformerInput3 := models.PerformerCreateInput{
		Name:           performerName3,
		Disambiguation: &performerDisambiguation3,
		Urls: []models.URL{
			{
				URL:    testURL3,
				SiteID: site.ID,
			},
		},
	}
	createdPerformer3, err := s.createTestPerformer(&actualPerformerInput3)
	assert.NoError(s.t, err)

	var resp6 struct {
		QueryExistingPerformer struct {
			Performers []struct {
				ID string
			}
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			queryExistingPerformer(input: {
				name: "%v"
				disambiguation: "%v"
				urls: []
			}) {
				performers {
					id
				}
			}
		}
	`, performerName3, performerDisambiguation3), &resp6)
	assert.True(s.t, len(resp6.QueryExistingPerformer.Performers) > 0, "Should find created performer by name and disambiguation")
	assert.Equal(s.t, createdPerformer3.ID, resp6.QueryExistingPerformer.Performers[0].ID, "Should return the correct performer with disambiguation")
}

func TestQueryExistingPerformer(t *testing.T) {
	pt := createPerformerEditTestRunner(t)
	pt.testQueryExistingPerformer()
}
