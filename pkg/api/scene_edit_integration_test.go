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
	assert.NilError(s.t, err)
	s.verifyCreatedSceneEdit(*sceneEditDetailsInput, edit)
}

func (s *sceneEditTestRunner) verifyCreatedSceneEdit(input models.SceneEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil, "Expected created edit id to be non-zero")

	s.verifyEditOperation(models.OperationEnumCreate.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	s.verifySceneEditDetails(input, edit)
}

func (s *sceneEditTestRunner) testFindEditById() {
	createdEdit, err := s.createTestSceneEdit(models.OperationEnumCreate, nil, nil)
	assert.NilError(s.t, err)

	edit, err := s.resolver.Query().FindEdit(s.ctx, createdEdit.ID)
	assert.NilError(s.t, err)
	assert.Assert(s.t, edit != nil, "Did not find edit by id")
}

func (s *sceneEditTestRunner) testModifySceneEdit() {
	existingTitle := "sceneName"
	existingDetails := "sceneDetails"

	sceneCreateInput := models.SceneCreateInput{
		Title:   &existingTitle,
		Details: &existingDetails,
		Date:    "2020-03-02",
	}
	createdScene, err := s.createTestScene(&sceneCreateInput)
	assert.NilError(s.t, err)

	sceneEditDetailsInput := s.createSceneEditDetailsInput()
	id := createdScene.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestSceneEdit(models.OperationEnumModify, sceneEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

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
	assert.Assert(s.t, inputAccuracy.Valid && (inputAccuracy.String == *sceneDetails.DateAccuracy), "DateAccuracy mismatch")
	assert.Equal(s.t, inputDate.String, *sceneDetails.Date)

	s.compareURLs(input.Urls, sceneDetails.AddedUrls)

	assert.DeepEqual(s.t, input.ImageIds, sceneDetails.AddedImages)
	assert.DeepEqual(s.t, input.TagIds, sceneDetails.AddedTags)

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
		assert.Assert(s.t, !scene.DateAccuracy.Valid)
	} else {
		assert.Equal(s.t, inputAccuracy.String, scene.DateAccuracy.String)
	}

	if input.Date == nil {
		assert.Assert(s.t, !scene.Date.Valid)
	} else {
		assert.Equal(s.t, inputDate.String, scene.Date.String)
	}

	urls, _ := resolver.Urls(s.ctx, scene)
	s.compareURLs(input.Urls, urls)

	images, _ := resolver.Images(s.ctx, scene)
	var imageIds []uuid.UUID
	for _, image := range images {
		imageIds = append(imageIds, image.ID)
	}
	assert.DeepEqual(s.t, input.ImageIds, imageIds)

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
	assert.NilError(s.t, err)

	sceneID := createdScene.UUID()

	sceneEditDetailsInput := models.SceneEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &sceneID,
	}
	destroyEdit, err := s.createTestSceneEdit(models.OperationEnumDestroy, &sceneEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	s.verifyDestroySceneEdit(sceneID, destroyEdit)
}

func (s *sceneEditTestRunner) verifyDestroySceneEdit(sceneID uuid.UUID, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumPending.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(false, edit)

	editTarget := s.getEditSceneTarget(edit)
	assert.Equal(s.t, sceneID, editTarget.ID)
}

func (s *sceneEditTestRunner) testMergeSceneEdit() {
	existingName := "sceneName2"
	sceneCreateInput := models.SceneCreateInput{
		Title: &existingName,
		Date:  "2020-03-02",
	}
	createdPrimaryScene, err := s.createTestScene(&sceneCreateInput)
	assert.NilError(s.t, err)

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
	assert.NilError(s.t, err)

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
	assert.DeepEqual(s.t, inputMergeSources, mergeSources)
}

func (s *sceneEditTestRunner) testApplyCreateSceneEdit() {
	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	edit, err := s.createTestSceneEdit(models.OperationEnumCreate, sceneEditDetailsInput, nil)
	appliedEdit, err := s.applyEdit(edit.ID)
	assert.NilError(s.t, err)
	s.verifyAppliedSceneCreateEdit(*sceneEditDetailsInput, appliedEdit)
}

func (s *sceneEditTestRunner) verifyAppliedSceneCreateEdit(input models.SceneEditDetailsInput, edit *models.Edit) {
	assert.Assert(s.t, edit.ID != uuid.Nil)

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
	assert.NilError(s.t, err)

	sceneCreateInput := models.SceneCreateInput{
		Title: &title,
		Urls: []*models.URLInput{
			{
				URL:    "http://example.org/asd",
				SiteID: site.ID,
			},
		},
		Date: "2020-03-02",
	}
	createdScene, err := s.createTestScene(&sceneCreateInput)
	assert.NilError(s.t, err)

	// Create edit that replaces all metadata for the scene
	sceneEditDetailsInput := s.createFullSceneEditDetailsInput()
	id := createdScene.UUID()
	editInput := models.EditInput{
		Operation: models.OperationEnumModify,
		ID:        &id,
	}

	createdUpdateEdit, err := s.createTestSceneEdit(models.OperationEnumModify, sceneEditDetailsInput, &editInput)
	assert.NilError(s.t, err)

	appliedEdit, err := s.applyEdit(createdUpdateEdit.ID)
	assert.NilError(s.t, err)

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
	assert.NilError(s.t, err)

	id := createdScene.UUID()

	var resp struct {
		SceneEdit struct {
			ID string
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		mutation {
			sceneEdit(input: {
				edit: {id: "%v", operation: MODIFY}
				details: { urls: [] }
			}) {
				id
			}
		}
	`, id), &resp)

	edit, _ := s.applyEdit(uuid.FromStringOrNil(resp.SceneEdit.ID))
	s.verifyAppliedSceneEdit(edit)

	var scene struct {
		FindScene struct {
			Director string
			URLs     []models.URL
		}
	}

	s.client.MustPost(fmt.Sprintf(`
		query {
			findScene(id: "%v") {
				director
				urls {
					url
				}
			}
		}
	`, id), &scene)

	assert.Equal(s.t, scene.FindScene.Director, *sceneData.Director)
	assert.Assert(s.t, len(scene.FindScene.URLs) == 0)
}

func (s *sceneEditTestRunner) testApplyDestroySceneEdit() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	sceneID := createdScene.UUID()

	sceneEditDetailsInput := models.SceneEditDetailsInput{}
	editInput := models.EditInput{
		Operation: models.OperationEnumDestroy,
		ID:        &sceneID,
	}
	destroyEdit, err := s.createTestSceneEdit(models.OperationEnumDestroy, &sceneEditDetailsInput, &editInput)
	assert.NilError(s.t, err)
	appliedEdit, err := s.applyEdit(destroyEdit.ID)

	destroyedScene, _ := s.resolver.Query().FindScene(s.ctx, sceneID)
	s.verifyApplyDestroySceneEdit(destroyedScene, appliedEdit)
}

func (s *sceneEditTestRunner) verifyApplyDestroySceneEdit(destroyedScene *models.Scene, edit *models.Edit) {
	s.verifyEditOperation(models.OperationEnumDestroy.String(), edit)
	s.verifyEditStatus(models.VoteStatusEnumImmediateAccepted.String(), edit)
	s.verifyEditTargetType(models.TargetTypeEnumScene.String(), edit)
	s.verifyEditApplication(true, edit)

	assert.Equal(s.t, destroyedScene.Deleted, true)
}

func (s *sceneEditTestRunner) testApplyMergeSceneEdit() {
	mergeSource1, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	mergeSource2, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	mergeTarget, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

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
	assert.NilError(s.t, err)

	appliedMerge, err := s.applyEdit(mergeEdit.ID)
	assert.NilError(s.t, err)

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
		assert.Equal(s.t, scene.Deleted, true)
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
