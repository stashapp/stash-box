//go:build integration
// +build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"gotest.tools/v3/assert"
)

type studioEditTestRunner struct {
	testRunner
}

func createStudioEditTestRunner(t *testing.T) *studioEditTestRunner {
	return &studioEditTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *studioEditTestRunner) testCreateStudioEdit() {
	parentStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	parentID := parentStudio.UUID()
	name := "Name"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &name,
		ParentID: &parentID,
	}

	edit, err := s.createTestStudioEdit(models.OperationEnumCreate, &studioEditDetailsInput, nil)
	assert.NilError(s.t, err)
	s.verifyCreatedStudioEdit(studioEditDetailsInput, edit)
}

func (s *studioEditTestRunner) verifyCreatedStudioEdit(input models.StudioEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	details, _ := r.Details(s.ctx, edit)
	studioDetails := details.(*models.StudioEdit)

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *studioDetails.Name)
	assert.Equal(s.t, *input.ParentID, *studioDetails.ParentID)
}

func (s *studioEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestStudioEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err, "Error finding edit")

	// ensure returned studio is not nil
	assert.Assert(s.t, edit != nil, "Did not find edit by id")
}

func (s *studioEditTestRunner) testModifyStudioEdit() {
	existingParentStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	existingParentID := existingParentStudio.UUID()
	existingName := "studioName"
	studioCreateInput := models.StudioCreateInput{
		Name:     existingName,
		ParentID: &existingParentID,
	}
	createdStudio, err := s.createTestStudio(&studioCreateInput)
	assert.NilError(s.t, err)

	newParent, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	newParentID := newParent.UUID()
	newName := "newName"

	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	url := models.URL{
		URL:    "http://example.org",
		SiteID: site.ID,
	}
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &newName,
		ParentID: &newParentID,
		Urls:     []models.URL{url},
	}
	id := createdStudio.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestStudioEdit(models.OperationEnumModify, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyUpdatedStudioEdit(createdStudio, studioEditDetailsInput, createdUpdateEdit)
}

func (s *studioEditTestRunner) verifyUpdatedStudioEdit(originalStudio *studioOutput, input models.StudioEditDetailsInput, edit *models.Edit) {
	studioDetails := s.getEditStudioDetails(edit)

	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *studioDetails.Name)
	assert.Equal(s.t, *input.ParentID, *studioDetails.ParentID)

	assert.DeepEqual(s.t, input.Urls, studioDetails.AddedUrls)
}

func (s *studioEditTestRunner) testDestroyStudioEdit() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	studioID := createdStudio.UUID()

	studioEditDetailsInput := models.StudioEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &studioID,
	}
	destroyEdit, err := s.createTestStudioEdit(models.OperationEnumDestroy, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyDestroyStudioEdit(studioID, destroyEdit)
}

func (s *studioEditTestRunner) verifyDestroyStudioEdit(studioID uuid.UUID, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditStudioTarget(edit)

	assert.Equal(s.t, studioID, editTarget.ID)
}

func (s *studioEditTestRunner) testMergeStudioEdit() {
	existingName := "studioName2"
	studioCreateInput := models.StudioCreateInput{
		Name: existingName,
	}
	createdPrimaryStudio, err := s.createTestStudio(&studioCreateInput)
	assert.NilError(s.t, err)

	createdMergeStudio, err := s.createTestStudio(nil)

	newName := "newName2"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name: &newName,
	}
	id := createdPrimaryStudio.UUID()
	mergeSources := []uuid.UUID{createdMergeStudio.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestStudioEdit(models.OperationEnumMerge, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyMergeStudioEdit(createdPrimaryStudio, studioEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *studioEditTestRunner) verifyMergeStudioEdit(originalStudio *studioOutput, input models.StudioEditDetailsInput, edit *models.Edit, inputMergeSources []uuid.UUID) {
	studioDetails := s.getEditStudioDetails(edit)

	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, *studioDetails.Name)

	var mergeSources []uuid.UUID
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Studio)
		mergeSources = append(mergeSources, merge.ID)
	}
	assert.DeepEqual(s.t, inputMergeSources, mergeSources)
}

func (s *studioEditTestRunner) testApplyCreateStudioEdit() {
	name := "Name"
	parent, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	parentID := parent.UUID()
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &name,
		ParentID: &parentID,
	}
	edit, err := s.createTestStudioEdit(models.OperationEnumCreate, &studioEditDetailsInput, nil)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NilError(s.t, err)
	s.verifyAppliedStudioCreateEdit(studioEditDetailsInput, appliedEdit)
}

func (s *studioEditTestRunner) verifyAppliedStudioCreateEdit(input models.StudioEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	studio := s.getEditStudioTarget(edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, studio.Name)
	assert.Equal(s.t, *input.ParentID, studio.ParentStudioID.UUID)
}

func (s *studioEditTestRunner) testApplyModifyStudioEdit() {
	existingName := "studioName3"
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	studioCreateInput := models.StudioCreateInput{
		Name: existingName,
		Urls: []models.URL{{
			URL:    "http://example.org/old",
			SiteID: site.ID,
		}},
	}
	createdStudio, err := s.createTestStudio(&studioCreateInput)
	assert.NilError(s.t, err)

	newName := "newName3"
	newParent, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	newParentID := newParent.UUID()
	newUrl := models.URL{
		URL:    "http://example.org/new",
		SiteID: site.ID,
	}
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &newName,
		ParentID: &newParentID,
		Urls:     []models.URL{newUrl},
	}
	id := createdStudio.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestStudioEdit(models.OperationEnumModify, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

	modifiedStudio, err := s.resolver.Query().FindStudio(s.ctx, &id, nil)
	assert.NilError(s.t, err)

	s.verifyApplyModifyStudioEdit(studioEditDetailsInput, modifiedStudio, appliedEdit)
}

func (s *studioEditTestRunner) verifyApplyModifyStudioEdit(input models.StudioEditDetailsInput, updatedStudio *models.Studio, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	// ensure basic attributes are set correctly
	assert.Equal(s.t, *input.Name, updatedStudio.Name)
	assert.Assert(s.t, updatedStudio.ParentStudioID.Valid && (*input.ParentID == updatedStudio.ParentStudioID.UUID))

	urls, _ := s.resolver.Studio().Urls(s.ctx, updatedStudio)
	assert.DeepEqual(s.t, input.Urls, urls)
}

func (s *studioEditTestRunner) testApplyModifyUnsetStudioEdit() {
	existingName := "studioName4"
	site, err := s.createTestSite(nil)
	assert.NilError(s.t, err)

	newParent, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)
	newParentID := newParent.UUID()

	studioCreateInput := models.StudioCreateInput{
		Name: existingName,
		Urls: []models.URL{{
			URL:    "http://example.org/old",
			SiteID: site.ID,
		}},
		ParentID: &newParentID,
	}
	createdStudio, err := s.createTestStudio(&studioCreateInput)
	assert.NilError(s.t, err)

	var resp struct {
		StudioEdit struct {
			ID string
		}
	}

	newName := "cleared-name"
	id := createdStudio.UUID()
	s.client.MustPost(fmt.Sprintf(`
		mutation {
			studioEdit(input: {
				edit: {id: "%v", operation: MODIFY}
				details: { parent_id: null, urls: [], name: "%s"}
			}) {
				id
			}
		}
	`, id, newName), &resp)

	_, err = s.applyEdit(uuid.FromStringOrNil(resp.StudioEdit.ID))
	assert.NilError(s.t, err)

	var studio struct {
		FindStudio struct {
			Name   string
			Parent struct {
				Id uuid.NullUUID
			}
			URLs []models.URL
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			findStudio(id: "%v") {
			  name
			  parent {
				  id
				}
				urls {
					url
				}
			}
		}
	`, id), &studio)

	assert.Equal(s.t, newName, studio.FindStudio.Name)
	assert.Assert(s.t, studio.FindStudio.Parent.Id.UUID.IsNil())
	assert.Assert(s.t, len(studio.FindStudio.URLs) == 0)
}

func (s *studioEditTestRunner) testApplyDestroyStudioEdit() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	studioID := createdStudio.UUID()
	sceneInput := models.SceneCreateInput{
		StudioID: &studioID,
		Date:     "2020-03-02",
	}
	scene, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	studioEditDetailsInput := models.StudioEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &studioID,
	}
	destroyEdit, err := s.createTestStudioEdit(models.OperationEnumDestroy, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(destroyEdit.ID)
	assert.NilError(s.t, err)

	destroyedStudio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	assert.NilError(s.t, err)

	scene, err = s.client.findScene(scene.UUID())
	assert.NilError(s.t, err)

	s.verifyApplyDestroyStudioEdit(destroyedStudio, appliedEdit, scene)
}

func (s *studioEditTestRunner) verifyApplyDestroyStudioEdit(destroyedStudio *models.Studio, edit *models.Edit, scene *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	assert.Equal(s.t, destroyedStudio.Deleted, true)
	assert.Assert(s.t, scene.Studio == nil)
}

func (s *studioEditTestRunner) testApplyMergeStudioEdit() {
	mergeSource1, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	mergeSource2, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	mergeTarget, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	// Scene with studio from both source and target, should not cause db unique error
	mergeTargetID := mergeTarget.UUID()
	sceneInput := models.SceneCreateInput{
		StudioID: &mergeTargetID,
		Date:     "2020-03-02",
	}
	scene1, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	mergeSource1ID := mergeSource1.UUID()
	sceneInput = models.SceneCreateInput{
		StudioID: &mergeSource1ID,
		Date:     "2020-03-02",
	}
	scene2, err := s.createTestScene(&sceneInput)
	assert.NilError(s.t, err)

	newName := "newName4"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name: &newName,
	}
	id := mergeTarget.UUID()
	mergeSources := []uuid.UUID{mergeSource1.UUID(), mergeSource2.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestStudioEdit(models.OperationEnumMerge, &studioEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	assert.NilError(s.t, err)

	scene1, err = s.client.findScene(scene1.UUID())
	assert.NilError(s.t, err)

	scene2, err = s.client.findScene(scene2.UUID())
	assert.NilError(s.t, err)

	s.verifyAppliedMergeStudioEdit(studioEditDetailsInput, appliedMerge, scene1, scene2)
}

func (s *studioEditTestRunner) verifyAppliedMergeStudioEdit(input models.StudioEditDetailsInput, edit *models.Edit, scene1 *sceneOutput, scene2 *sceneOutput) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	studioDetails := s.getEditStudioDetails(edit)
	assert.Equal(s.t, *input.Name, *studioDetails.Name)

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		studio := merges[i].(*models.Studio)
		assert.Equal(s.t, studio.Deleted, true)
	}

	editTarget := s.getEditStudioTarget(edit)
	assert.Equal(s.t, scene1.Studio.ID, editTarget.ID.String())
	assert.Equal(s.t, scene2.Studio.ID, editTarget.ID.String())
}

func (s *studioEditTestRunner) testStudioEditUpdate() {
	// Create a pending edit
	name := "Original Studio Name"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name: &name,
	}
	createdEdit, err := s.createTestStudioEdit(models.OperationEnumCreate, &studioEditDetailsInput, nil)
	assert.NilError(s.t, err)

	// Update the edit with new details
	newName := "Updated Studio Name"
	updatedDetails := models.StudioEditDetailsInput{
		Name: &newName,
	}

	editID := createdEdit.ID
	updatedEdit, err := s.resolver.Mutation().StudioEditUpdate(s.ctx, createdEdit.ID, models.StudioEditInput{
		Edit:    &models.EditInput{ID: &editID},
		Details: &updatedDetails,
	})
	assert.NilError(s.t, err, "Error updating studio edit")

	// Verify the edit was updated
	assert.Equal(s.t, createdEdit.ID, updatedEdit.ID, "Edit ID should not change")
	assert.Assert(s.t, updatedEdit != nil, "Updated edit should not be nil")
}

func TestCreateStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testCreateStudioEdit()
}

func TestModifyStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testModifyStudioEdit()
}

func TestDestroyStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testDestroyStudioEdit()
}

func TestMergeStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testMergeStudioEdit()
}

func TestApplyCreateStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyCreateStudioEdit()
}

func TestApplyModifyStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyModifyStudioEdit()
}

func TestApplyModifyUnsetStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyModifyUnsetStudioEdit()
}

func TestApplyDestroyStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyDestroyStudioEdit()
}

func TestApplyMergeStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyMergeStudioEdit()
}

func TestStudioEditUpdate(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testStudioEditUpdate()
}
