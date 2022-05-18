//go:build integration
// +build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneEditTestRunner struct {
	testRunner
}

func createSceneEditTestRunner(t *testing.T) *sceneEditTestRunner {
	return &sceneEditTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *sceneEditTestRunner) testCreateSceneEdit() {
	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()

	edit, err := s.createTestSceneEdit(models.OperationEnumCreate, sceneEditDetailsInput, nil)
	if err == nil {
		s.verifyCreatedSceneEdit(*sceneEditDetailsInput, edit)
	}
}

func (s *sceneEditTestRunner) verifyCreatedSceneEdit(input models.SceneEditDetailsInput, edit *models.Edit) {
	if edit.ID == uuid.Nil {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifySceneEditDetails(input, edit)
}

func (s *sceneEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestSceneEdit(models.OperationEnumCreate, nil, nil)
	if err != nil {
		return
	}

	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	if err != nil {
		s.t.Errorf("Error finding edit: %s", err.Error())
		return
	}

	// ensure returned scene is not nil
	if edit == nil {
		s.t.Error("Did not find edit by id")
		return
	}
}

func (s *sceneEditTestRunner) testModifySceneEdit() {
	existingTitle := "sceneName"
	existingDetails := "sceneDetails"

	sceneCreateInput := models.SceneCreateInput{
		Title:   &existingTitle,
		Details: &existingDetails,
	}
	createdScene, err := s.createTestScene(&sceneCreateInput)
	if err != nil {
		return
	}

	sceneEditDetailsInput := s.createSceneEditDetailsInput()
	id := createdScene.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestSceneEdit(models.OperationEnumModify, sceneEditDetailsInput, &editInput)

	s.verifyUpdatedSceneEdit(createdScene, *sceneEditDetailsInput, createdUpdateEdit)
}

func (s *sceneEditTestRunner) verifyUpdatedSceneEdit(originalScene *sceneOutput, input models.SceneEditDetailsInput, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifySceneEditDetails(input, edit)
}

func (s *sceneEditTestRunner) verifySceneEditDetails(input models.SceneEditDetailsInput, edit *models.Edit) {
	sceneDetails := s.getEditSceneDetails(edit)

	c := fieldComparator{r: &s.testRunner}
	c.strPtrStrPtr(input.Title, sceneDetails.Title, "Title")
	c.strPtrStrPtr(input.Details, sceneDetails.Details, "Details")
	c.strPtrStrPtr(input.Director, sceneDetails.Director, "Director")
	c.strPtrStrPtr(input.Code, sceneDetails.Code, "Code")
	c.uuidPtrUUIDPtr(input.StudioID, sceneDetails.StudioID, "StudioID")
	c.intPtrInt64Ptr(input.Duration, sceneDetails.Duration, "Duration")

	inputDate, inputAccuracy, _ := models.ParseFuzzyString(input.Date)
	if !inputAccuracy.Valid || (inputAccuracy.String != *sceneDetails.DateAccuracy) {
		s.fieldMismatch(inputAccuracy.String, *sceneDetails.DateAccuracy, "DateAccuracy")
	}

	if inputDate.String != *sceneDetails.Date {
		s.fieldMismatch(inputDate.String, sceneDetails.Date, "Date")
	}

	s.compareURLs(input.Urls, sceneDetails.AddedUrls)

	if !reflect.DeepEqual(input.ImageIds, sceneDetails.AddedImages) {
		s.fieldMismatch(input.ImageIds, sceneDetails.AddedImages, "Images")
	}

	if !reflect.DeepEqual(input.TagIds, sceneDetails.AddedTags) {
		s.fieldMismatch(input.TagIds, sceneDetails.AddedTags, "Tags")
	}

	if !comparePerformersInput(input.Performers, sceneDetails.AddedPerformers) {
		s.fieldMismatch(input.Performers, sceneDetails.AddedPerformers, "Performers")
	}
}

func (s *sceneEditTestRunner) verifySceneEdit(input models.SceneEditDetailsInput, scene *models.Scene) {
	resolver := s.resolver.Scene()

	c := fieldComparator{r: &s.testRunner}
	c.strPtrNullStr(input.Title, scene.Title, "Title")
	c.strPtrNullStr(input.Details, scene.Details, "Details")
	c.strPtrNullStr(input.Director, scene.Director, "Director")
	c.strPtrNullStr(input.Code, scene.Code, "Code")
	c.uuidPtrNullUUID(input.StudioID, scene.StudioID, "StudioID")
	c.intPtrNullInt64(input.Duration, scene.Duration, "Duration")

	inputDate, inputAccuracy, _ := models.ParseFuzzyString(input.Date)
	if input.Date == nil {
		if scene.DateAccuracy.Valid {
			s.fieldMismatch(inputDate.String, scene.DateAccuracy.String, "DateAccuracy")
		}
	} else if inputAccuracy.String != scene.DateAccuracy.String {
		s.fieldMismatch(inputAccuracy.String, scene.DateAccuracy.String, "DateAccuracy")
	}

	if input.Date == nil {
		if scene.Date.Valid {
			s.fieldMismatch(input.Date, scene.Date.String, "Date")
		}
	} else if inputDate.String != scene.Date.String {
		s.fieldMismatch(inputDate.String, scene.Date.String, "Date")
	}

	urls, _ := resolver.Urls(s.ctx, scene)
	s.compareURLs(input.Urls, urls)

	images, _ := resolver.Images(s.ctx, scene)
	var imageIds []uuid.UUID
	for _, image := range images {
		imageIds = append(imageIds, image.ID)
	}
	if !reflect.DeepEqual(input.ImageIds, imageIds) {
		s.fieldMismatch(input.ImageIds, imageIds, "Images")
	}

	tags, _ := resolver.Tags(s.ctx, scene)

	var tagIdObjs []*idObject
	for _, t := range tags {
		tagIdObjs = append(tagIdObjs, &idObject{ID: t.ID.String()})
	}

	if !compareTags(input.TagIds, tagIdObjs) {
		s.fieldMismatch(input.TagIds, tags, "Tags")
	}

	performers, _ := resolver.Performers(s.ctx, scene)
	var performerIdObjs []*performerAppearance
	for _, p := range performers {
		performerIdObjs = append(performerIdObjs, &performerAppearance{
			Performer: &idObject{
				ID: p.Performer.ID.String(),
			},
			As: p.As,
		})
	}

	if !comparePerformers(input.Performers, performerIdObjs) {
		s.fieldMismatch(input.Performers, performers, "Performers")
	}
}

func (s *sceneEditTestRunner) testDestroySceneEdit() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneID := createdScene.UUID()

	sceneEditDetailsInput := models.SceneEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &sceneID,
	}
	destroyEdit, err := s.createTestSceneEdit(models.OperationEnumDestroy, &sceneEditDetailsInput, &editInput)

	s.verifyDestroySceneEdit(sceneID, destroyEdit)
}

func (s *sceneEditTestRunner) verifyDestroySceneEdit(sceneID uuid.UUID, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditSceneTarget(edit)

	if sceneID != editTarget.ID {
		s.fieldMismatch(sceneID, editTarget.ID.String(), "ID")
	}
}

func (s *sceneEditTestRunner) testMergeSceneEdit() {
	existingName := "sceneName2"
	sceneCreateInput := models.SceneCreateInput{
		Title: &existingName,
	}
	createdPrimaryScene, err := s.createTestScene(&sceneCreateInput)
	if err != nil {
		return
	}

	createdMergeScene, err := s.createTestScene(nil)

	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	id := createdPrimaryScene.UUID()
	mergeSources := []uuid.UUID{createdMergeScene.UUID()}
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	createdMergeEdit, err := s.createTestSceneEdit(models.OperationEnumMerge, sceneEditDetailsInput, &editInput)

	s.verifyMergeSceneEdit(createdPrimaryScene, *sceneEditDetailsInput, createdMergeEdit, mergeSources)
}

func (s *sceneEditTestRunner) verifyMergeSceneEdit(originalScene *sceneOutput, input models.SceneEditDetailsInput, edit *models.Edit, inputMergeSources []uuid.UUID) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifySceneEditDetails(input, edit)

	var mergeSources []uuid.UUID
	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		merge := merges[i].(*models.Scene)
		mergeSources = append(mergeSources, merge.ID)
	}
	if !reflect.DeepEqual(inputMergeSources, mergeSources) {
		s.fieldMismatch(inputMergeSources, mergeSources, "MergeSources")
	}
}

func (s *sceneEditTestRunner) testApplyCreateSceneEdit() {
	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	edit, err := s.createTestSceneEdit(models.OperationEnumCreate, sceneEditDetailsInput, nil)
	appliedEdit, err := s.applyEdit(edit.ID)
	if err == nil {
		s.verifyAppliedSceneCreateEdit(*sceneEditDetailsInput, appliedEdit)
	}
}

func (s *sceneEditTestRunner) verifyAppliedSceneCreateEdit(input models.SceneEditDetailsInput, edit *models.Edit) {
	if edit.ID == uuid.Nil {
		s.t.Errorf("Expected created edit id to be non-zero")
	}

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)

	scene := s.getEditSceneTarget(edit)
	s.verifySceneEdit(input, scene)
}

func (s *sceneEditTestRunner) testApplyModifySceneEdit() {
	title := "sceneName3"
	site, err := s.createTestSite(nil)
	if err != nil {
		return
	}

	sceneCreateInput := models.SceneCreateInput{
		Title: &title,
		Urls: []*models.URLInput{
			{
				URL:    "http://example.org/asd",
				SiteID: site.ID,
			},
		},
	}
	createdScene, err := s.createTestScene(&sceneCreateInput)
	if err != nil {
		return
	}

	// Create edit that replaces all metadata for the scene
	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	id := createdScene.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestSceneEdit(models.OperationEnumModify, sceneEditDetailsInput, &editInput)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	if err != nil {
		return
	}

	modifiedScene, _ := s.resolver.Query().FindScene(s.ctx, id)
	s.verifyApplyModifySceneEdit(*sceneEditDetailsInput, modifiedScene, appliedEdit)
}

func (s *sceneEditTestRunner) verifyApplyModifySceneEdit(input models.SceneEditDetailsInput, updatedScene *models.Scene, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumModify.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)

	s.verifySceneEdit(input, updatedScene)
}

func (s *sceneEditTestRunner) testApplyModifyUnsetSceneEdit() {
	sceneData := s.createFullSceneCreateInput()
	createdScene, err := s.createTestScene(sceneData)
	if err != nil {
		return
	}
	id := createdScene.UUID()

	sceneUnsetInput := models.SceneEditDetailsInput{
		Urls: []*models.URLInput{},
	}

	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestSceneEdit(models.OperationEnumModify, &sceneUnsetInput, &editInput)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	if err != nil {
		return
	}

	modifiedScene, _ := s.resolver.Query().FindScene(s.ctx, id)
	s.verifyApplyModifySceneEdit(sceneUnsetInput, modifiedScene, appliedEdit)
}

func (s *sceneEditTestRunner) testApplyDestroySceneEdit() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneID := createdScene.UUID()

	sceneEditDetailsInput := models.SceneEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &sceneID,
	}
	destroyEdit, err := s.createTestSceneEdit(models.OperationEnumDestroy, &sceneEditDetailsInput, &editInput)
	if err != nil {
		return
	}
	appliedEdit, err := s.applyEdit(destroyEdit.ID)

	destroyedScene, _ := s.resolver.Query().FindScene(s.ctx, sceneID)
	s.verifyApplyDestroySceneEdit(destroyedScene, appliedEdit)
}

func (s *sceneEditTestRunner) verifyApplyDestroySceneEdit(destroyedScene *models.Scene, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)

	if destroyedScene.Deleted != true {
		s.fieldMismatch(destroyedScene.Deleted, true, "Deleted")
	}
}

func (s *sceneEditTestRunner) testApplyMergeSceneEdit() {
	mergeSource1, err := s.createTestScene(nil)
	if err != nil {
		return
	}
	mergeSource2, err := s.createTestScene(nil)
	if err != nil {
		return
	}
	mergeTarget, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	mergeSources := []uuid.UUID{
		mergeSource1.UUID(),
		mergeSource2.UUID(),
	}

	id := mergeTarget.UUID()
	editInput := models.EditInput{
		Operation:      models.OperationEnumMerge,
		ID:             &id,
		MergeSourceIds: mergeSources,
	}

	mergeEdit, err := s.createTestSceneEdit(models.OperationEnumMerge, sceneEditDetailsInput, &editInput)
	if err != nil {
		return
	}

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	if err != nil {
		return
	}

	s.verifyAppliedMergeSceneEdit(*sceneEditDetailsInput, appliedMerge)
}

func (s *sceneEditTestRunner) verifyAppliedMergeSceneEdit(input models.SceneEditDetailsInput, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumMerge.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)

	s.verifySceneEditDetails(input, edit)

	merges, _ := s.resolver.Edit().MergeSources(s.ctx, edit)
	for i := range merges {
		scene := merges[i].(*models.Scene)
		if scene.Deleted != true {
			s.fieldMismatch(scene.Deleted, true, "Deleted")
		}
	}
}

func TestCreateSceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testCreateSceneEdit()
}

func TestModifySceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testModifySceneEdit()
}

func TestDestroySceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testDestroySceneEdit()
}

func TestMergeSceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testMergeSceneEdit()
}

func TestApplyCreateSceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testApplyCreateSceneEdit()
}

func TestApplyModifySceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testApplyModifySceneEdit()
}

func TestApplyModifyUnsetSceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testApplyModifyUnsetSceneEdit()
}

func TestApplyDestroySceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testApplyDestroySceneEdit()
}

func TestApplyMergeSceneEdit(t *testing.T) {
	pt := createSceneEditTestRunner(t)
	pt.testApplyMergeSceneEdit()
}
