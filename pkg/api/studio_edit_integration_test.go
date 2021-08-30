//go:build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
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
	if err != nil {
		return
	}
	parentID := parentStudio.ID.String()
	name := "Name"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &name,
		ParentID: &parentID,
	}
	edit, err := s.createTestStudioEdit(models.OperationEnumCreate, &studioEditDetailsInput, nil)
	if err == nil {
		s.verifyCreatedStudioEdit(studioEditDetailsInput, edit)
	}
}

func (s *studioEditTestRunner) verifyCreatedStudioEdit(input models.StudioEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	id, _ := r.ID(s.ctx, edit)
	if id == "" {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	details, _ := r.Details(s.ctx, edit)
	studioDetails := details.(*models.StudioEdit)

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *studioDetails.Name {
		s.fieldMismatch(input.Name, studioDetails.Name, "Name")
	}

	if *input.ParentID != *studioDetails.ParentID {
		s.fieldMismatch(*input.ParentID, *studioDetails.ParentID, "ParentID")
	}
}

func (s *studioEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestStudioEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	editID := createdEdit.ID.String()
	edit, err := s.resolver.Query().FindEdit(s.ctx, &editID)
	if err != nil {
		s.t.Errorf("Error finding edit: %s", err.Error())
		return
	}

	// ensure returned studio is not nil
	if edit == nil {
		s.t.Error("Did not find edit by id")
		return
	}
}

func (s *studioEditTestRunner) testModifyStudioEdit() {
	existingParentStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	existingParentID := existingParentStudio.ID.String()
	existingName := "studioName"
	studioCreateInput := models.StudioCreateInput{
		Name:     existingName,
		ParentID: &existingParentID,
	}
	createdStudio, err := s.createTestStudio(&studioCreateInput)
	if err != nil {
		return
	}

	newParent, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	newParentID := newParent.ID.String()
	newName := "newName"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &newName,
		ParentID: &newParentID,
	}
	id := createdStudio.ID.String()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestStudioEdit(models.OperationEnumModify, &studioEditDetailsInput, &editInput)

	s.verifyUpdatedStudioEdit(createdStudio, studioEditDetailsInput, createdUpdateEdit)
}

func (s *studioEditTestRunner) verifyUpdatedStudioEdit(originalStudio *models.Studio, input models.StudioEditDetailsInput, edit *models.Edit) {
	studioDetails := s.getEditStudioDetails(edit)

	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *studioDetails.Name {
		s.fieldMismatch(*input.Name, *studioDetails.Name, "Name")
	}

	if *input.ParentID != *studioDetails.ParentID {
		s.fieldMismatch(*input.ParentID, *studioDetails.ParentID, "ParentID")
	}
}

func (s *studioEditTestRunner) testDestroyStudioEdit() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	studioID := createdStudio.ID.String()

	studioEditDetailsInput := models.StudioEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &studioID,
	}
	destroyEdit, err := s.createTestStudioEdit(models.OperationEnumDestroy, &studioEditDetailsInput, &editInput)

	s.verifyDestroyStudioEdit(studioID, destroyEdit)
}

func (s *studioEditTestRunner) verifyDestroyStudioEdit(studioID string, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditStudioTarget(edit)

	if studioID != editTarget.ID.String() {
		s.fieldMismatch(studioID, editTarget.ID.String(), "ID")
	}
}

func (s *studioEditTestRunner) testMergeStudioEdit() {
	existingName := "studioName2"
	studioCreateInput := models.StudioCreateInput{
		Name: existingName,
	}
	createdPrimaryStudio, err := s.createTestStudio(&studioCreateInput)
	if err != nil {
		return
	}

	createdMergeStudio, err := s.createTestStudio(nil)

	newName := "newName2"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name: &newName,
	}
	id := createdPrimaryStudio.ID.String()
	mergeSources := []string{createdMergeStudio.ID.String()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestStudioEdit(models.OperationEnumMerge, &studioEditDetailsInput, &editInput)

	s.verifyMergeStudioEdit(createdPrimaryStudio, studioEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *studioEditTestRunner) verifyMergeStudioEdit(originalStudio *models.Studio, input models.StudioEditDetailsInput, edit *models.Edit, inputMergeSources []string) {
	studioDetails := s.getEditStudioDetails(edit)

	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(false, edit)

	// ensure basic attributes are set correctly
	if *input.Name != *studioDetails.Name {
		s.fieldMismatch(*input.Name, *studioDetails.Name, "Name")
	}

	mergeSources := []string{}
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Studio)
		mergeSources = append(mergeSources, merge.ID.String())
	}
	if !reflect.DeepEqual(inputMergeSources, mergeSources) {
		s.fieldMismatch(inputMergeSources, mergeSources, "MergeSources")
	}
}

func (s *studioEditTestRunner) testApplyCreateStudioEdit() {
	name := "Name"
	parent, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	parentID := parent.ID.String()
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &name,
		ParentID: &parentID,
	}
	edit, err := s.createTestStudioEdit(models.OperationEnumCreate, &studioEditDetailsInput, nil)
	appliedEdit, err := s.applyEdit(edit.ID.String())
	if err == nil {
		s.verifyAppliedStudioCreateEdit(studioEditDetailsInput, appliedEdit)
	}
}

func (s *studioEditTestRunner) verifyAppliedStudioCreateEdit(input models.StudioEditDetailsInput, edit *models.Edit) {
	r := s.resolver.Edit()

	id, _ := r.ID(s.ctx, edit)
	if id == "" {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	studio := s.getEditStudioTarget(edit)

	// ensure basic attributes are set correctly
	if *input.Name != studio.Name {
		s.fieldMismatch(input.Name, studio.Name, "Name")
	}

	if *input.ParentID != studio.ParentStudioID.UUID.String() {
		s.fieldMismatch(*input.ParentID, studio.ParentStudioID.UUID.String(), "ParentID")
	}
}

func (s *studioEditTestRunner) testApplyModifyStudioEdit() {
	existingName := "studioName3"
	studioCreateInput := models.StudioCreateInput{
		Name: existingName,
	}
	createdStudio, err := s.createTestStudio(&studioCreateInput)
	if err != nil {
		return
	}

	newName := "newName3"
	newParent, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	newParentID := newParent.ID.String()
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name:     &newName,
		ParentID: &newParentID,
	}
	id := createdStudio.ID.String()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestStudioEdit(models.OperationEnumModify, &studioEditDetailsInput, &editInput)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID.String())
	if err != nil {
		return
	}

	modifiedStudio, _ := s.resolver.Query().FindStudio(s.ctx, &id, nil)
	s.verifyApplyModifyStudioEdit(studioEditDetailsInput, modifiedStudio, appliedEdit)
}

func (s *studioEditTestRunner) verifyApplyModifyStudioEdit(input models.StudioEditDetailsInput, updatedStudio *models.Studio, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	// ensure basic attributes are set correctly
	if *input.Name != updatedStudio.Name {
		s.fieldMismatch(*input.Name, updatedStudio.Name, "Name")
	}

	if !updatedStudio.ParentStudioID.Valid || *input.ParentID != updatedStudio.ParentStudioID.UUID.String() {
		s.fieldMismatch(*input.ParentID, updatedStudio.ParentStudioID.UUID.String(), "ParentStudioID")
	}
}

func (s *studioEditTestRunner) testApplyDestroyStudioEdit() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	studioID := createdStudio.ID.String()
	sceneInput := models.SceneCreateInput{
		StudioID: &studioID,
	}
	scene, _ := s.createTestScene(&sceneInput)

	studioEditDetailsInput := models.StudioEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &studioID,
	}
	destroyEdit, err := s.createTestStudioEdit(models.OperationEnumDestroy, &studioEditDetailsInput, &editInput)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(destroyEdit.ID.String())

	destroyedStudio, _ := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	scene, _ = s.resolver.Query().FindScene(s.ctx, scene.ID.String())
	s.verifyApplyDestroyStudioEdit(destroyedStudio, appliedEdit, scene)
}

func (s *studioEditTestRunner) verifyApplyDestroyStudioEdit(destroyedStudio *models.Studio, edit *models.Edit, scene *models.Scene) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	if destroyedStudio.Deleted != true {
		s.fieldMismatch(destroyedStudio.Deleted, true, "Deleted")
	}

	sceneStudio, _ := s.resolver.Scene().Studio(s.ctx, scene)
	if sceneStudio != nil {
		s.fieldMismatch(sceneStudio, nil, "Scene studio")
	}
}

func (s *studioEditTestRunner) testApplyMergeStudioEdit() {
	mergeSource1, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	mergeSource2, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	mergeTarget, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	// Scene with studio from both source and target, should not cause db unique error
	mergeTargetID := mergeTarget.ID.String()
	sceneInput := models.SceneCreateInput{
		StudioID: &mergeTargetID,
	}
	scene1, err := s.createTestScene(&sceneInput)
	if err != nil {
		return
	}

	mergeSource1ID := mergeSource1.ID.String()
	sceneInput = models.SceneCreateInput{
		StudioID: &mergeSource1ID,
	}
	scene2, err := s.createTestScene(&sceneInput)
	if err != nil {
		return
	}

	newName := "newName4"
	studioEditDetailsInput := models.StudioEditDetailsInput{
		Name: &newName,
	}
	id := mergeTarget.ID.String()
	mergeSources := []string{mergeSource1.ID.String(), mergeSource2.ID.String()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestStudioEdit(models.OperationEnumMerge, &studioEditDetailsInput, &editInput)
	if err != nil {
		return
	}

	appliedMerge, err := s.applyEdit(mergeEdit.ID.String())
	if err != nil {
		return
	}

	scene1, _ = s.resolver.Query().FindScene(s.ctx, scene1.ID.String())
	scene2, _ = s.resolver.Query().FindScene(s.ctx, scene2.ID.String())

	s.verifyAppliedMergeStudioEdit(studioEditDetailsInput, appliedMerge, scene1, scene2)
}

func (s *studioEditTestRunner) verifyAppliedMergeStudioEdit(input models.StudioEditDetailsInput, edit *models.Edit, scene1 *models.Scene, scene2 *models.Scene) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumStudio.String(), edit)
	s.verifyEditApplication(true, edit)

	studioDetails := s.getEditStudioDetails(edit)
	if *input.Name != *studioDetails.Name {
		s.fieldMismatch(*input.Name, *studioDetails.Name, "Name")
	}

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		studio := merges[i].(*models.Studio)
		if studio.Deleted != true {
			s.fieldMismatch(studio.Deleted, true, "Deleted")
		}
	}

	editTarget := s.getEditStudioTarget(edit)
	scene1Studio, _ := s.resolver.Scene().Studio(s.ctx, scene1)
	if scene1Studio.ID != editTarget.ID {
		s.fieldMismatch(scene1Studio.ID, editTarget.ID, "Scene 1 studio ID")
	}

	scene2Studio, _ := s.resolver.Scene().Studio(s.ctx, scene2)
	if scene2Studio.ID != editTarget.ID {
		s.fieldMismatch(scene2Studio.ID, editTarget.ID, "Scene 2 studio ID")
	}
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

func TestApplyDestroyStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyDestroyStudioEdit()
}

func TestApplyMergeStudioEdit(t *testing.T) {
	pt := createStudioEditTestRunner(t)
	pt.testApplyMergeStudioEdit()
}
