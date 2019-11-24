// +build integration

package api_test

import (
	"reflect"
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

type sceneTestRunner struct {
	testRunner
}

func createSceneTestRunner(t *testing.T) *sceneTestRunner {
	return &sceneTestRunner{
		testRunner: *createTestRunner(t),
	}
}

func (s *sceneTestRunner) testCreateScene() {
	title := "Title"
	details := "Details"
	url := "URL"
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestScene(nil)
	tag, _ := s.createTestTag(nil)

	performerID := strconv.FormatInt(performer.ID, 10)
	studioID := strconv.FormatInt(studio.ID, 10)
	tagID := strconv.FormatInt(tag.ID, 10)

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Checksums: []string{
			"checksum1",
			"checksum2",
		},
		StudioID: &studioID,
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		TagIds: []string{
			tagID,
		},
	}

	scene, err := s.resolver.Mutation().SceneCreate(s.ctx, input)

	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return
	}

	s.verifyCreatedScene(input, scene)
}

func comparePerformers(input []*models.PerformerAppearanceInput, performers []*models.PerformerAppearance) bool {
	if len(performers) != len(input) {
		return false
	}

	for i, v := range performers {
		performerID := strconv.FormatInt(v.Performer.ID, 10)
		if performerID != input[i].PerformerID {
			return false
		}

		if v.As != input[i].As {
			if v.As == nil || input[i].As == nil {
				return false
			}

			if *v.As != *input[i].As {
				return false
			}
		}
	}

	return true
}

func compareTags(tagIDs []string, tags []*models.Tag) bool {
	if len(tags) != len(tagIDs) {
		return false
	}

	for i, v := range tags {
		tagID := strconv.FormatInt(v.ID, 10)
		if tagID != tagIDs[i] {
			return false
		}
	}

	return true
}

func (s *sceneTestRunner) verifyCreatedScene(input models.SceneCreateInput, scene *models.Scene) {
	// ensure basic attributes are set correctly
	r := s.resolver.Scene()

	id, _ := r.ID(s.ctx, scene)
	if id == "" {
		s.t.Errorf("Expected created scene id to be non-zero")
	}

	if v, _ := r.Title(s.ctx, scene); !reflect.DeepEqual(v, input.Title) {
		s.fieldMismatch(*input.Title, v, "Title")
	}

	if v, _ := r.Details(s.ctx, scene); !reflect.DeepEqual(v, input.Details) {
		s.fieldMismatch(input.Details, v, "Details")
	}

	if v, _ := r.URL(s.ctx, scene); !reflect.DeepEqual(v, input.URL) {
		s.fieldMismatch(*input.URL, v, "URL")
	}

	if v, _ := r.Date(s.ctx, scene); !reflect.DeepEqual(v, input.Date) {
		s.fieldMismatch(*input.Date, v, "Date")
	}

	if v, _ := r.Checksums(s.ctx, scene); !reflect.DeepEqual(v, input.Checksums) {
		s.fieldMismatch(input.Checksums, v, "Checksums")
	}

	performers, err := s.resolver.Scene().Performers(s.ctx, scene)
	if err != nil {
		s.t.Errorf("Error getting scene performers: %s", err.Error())
	}

	if !comparePerformers(input.Performers, performers) {
		s.fieldMismatch(input.Performers, performers, "Performers")
	}

	tags, err := s.resolver.Scene().Tags(s.ctx, scene)
	if err != nil {
		s.t.Errorf("Error getting scene tags: %s", err.Error())
	}

	if !compareTags(input.TagIds, tags) {
		s.fieldMismatch(input.TagIds, tags, "Tags")
	}
}

func (s *sceneTestRunner) testFindSceneById() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneID := strconv.FormatInt(createdScene.ID, 10)
	scene, err := s.resolver.Query().FindScene(s.ctx, &sceneID, nil)
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// ensure returned scene is not nil
	if scene == nil {
		s.t.Error("Did not find scene by id")
		return
	}

	// ensure values were set
	if createdScene.Title != scene.Title {
		s.fieldMismatch(createdScene.Title, scene.Title, "Title")
	}
}

func (s *sceneTestRunner) testFindSceneByChecksum() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	checksums, _ := s.resolver.Scene().Checksums(s.ctx, createdScene)

	scene, err := s.resolver.Query().FindScene(s.ctx, nil, &checksums[0])
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// ensure returned scene is not nil
	if scene == nil {
		s.t.Error("Did not find scene by checksum")
		return
	}

	// ensure values were set
	if createdScene.Title != scene.Title {
		s.fieldMismatch(createdScene.Title, scene.Title, "Title")
	}
}

func (s *sceneTestRunner) testUpdateScene() {
	title := "Title"
	details := "Details"
	url := "URL"
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestScene(nil)
	tag, _ := s.createTestTag(nil)

	performerID := strconv.FormatInt(performer.ID, 10)
	studioID := strconv.FormatInt(studio.ID, 10)
	tagID := strconv.FormatInt(tag.ID, 10)

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Checksums: []string{
			s.generateSceneChecksum(),
			s.generateSceneChecksum(),
		},
		StudioID: &studioID,
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		TagIds: []string{
			tagID,
		},
	}

	createdScene, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	sceneID := strconv.FormatInt(createdScene.ID, 10)

	newTitle := "NewTitle"
	newDetails := "NewDetails"
	newURL := "NewURL"
	newDate := "2001-02-03"

	performer, _ = s.createTestPerformer(nil)
	studio, _ = s.createTestScene(nil)
	tag, _ = s.createTestTag(nil)

	performerID = strconv.FormatInt(performer.ID, 10)
	studioID = strconv.FormatInt(studio.ID, 10)
	tagID = strconv.FormatInt(tag.ID, 10)

	performerAlias = "updatedAlias"

	updateInput := models.SceneUpdateInput{
		ID:      sceneID,
		Title:   &newTitle,
		Details: &newDetails,
		URL:     &newURL,
		Date:    &newDate,
		Checksums: []string{
			s.generateSceneChecksum(),
		},
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		StudioID: &studioID,
		TagIds: []string{
			tagID,
		},
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"checksums",
		"performers",
		"tagIds",
	})

	updatedScene, err := s.resolver.Mutation().SceneUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating scene: %s", err.Error())
		return
	}

	s.verifyUpdatedScene(updateInput, updatedScene)
}

func (s *sceneTestRunner) testUpdateSceneTitle() {
	title := "Title"
	details := "Details"
	url := "URL"
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestScene(nil)
	tag, _ := s.createTestTag(nil)

	performerID := strconv.FormatInt(performer.ID, 10)
	studioID := strconv.FormatInt(studio.ID, 10)
	tagID := strconv.FormatInt(tag.ID, 10)

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Checksums: []string{
			s.generateSceneChecksum(),
			s.generateSceneChecksum(),
		},
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		StudioID: &studioID,
		TagIds: []string{
			tagID,
		},
	}

	createdScene, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	sceneID := strconv.FormatInt(createdScene.ID, 10)
	newTitle := "NewTitle"

	updateInput := models.SceneUpdateInput{
		ID:    sceneID,
		Title: &newTitle,
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"title",
	})
	updatedScene, err := s.resolver.Mutation().SceneUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating scene: %s", err.Error())
		return
	}

	input.Title = &newTitle
	s.verifyCreatedScene(input, updatedScene)
}

func (s *sceneTestRunner) verifyUpdatedScene(input models.SceneUpdateInput, scene *models.Scene) {
	// ensure basic attributes are set correctly
	r := s.resolver.Scene()

	if v, _ := r.Title(s.ctx, scene); !reflect.DeepEqual(v, input.Title) {
		s.fieldMismatch(input.Title, v, "Title")
	}

	if v, _ := r.Details(s.ctx, scene); !reflect.DeepEqual(v, input.Details) {
		s.fieldMismatch(input.Details, v, "Details")
	}

	if v, _ := r.URL(s.ctx, scene); !reflect.DeepEqual(v, input.URL) {
		s.fieldMismatch(input.URL, v, "URL")
	}

	if v, _ := r.Date(s.ctx, scene); !reflect.DeepEqual(v, input.Date) {
		s.fieldMismatch(input.Date, v, "Date")
	}

	if v, _ := r.Checksums(s.ctx, scene); !reflect.DeepEqual(v, input.Checksums) {
		s.fieldMismatch(input.Checksums, v, "Checksums")
	}

	performers, _ := s.resolver.Scene().Performers(s.ctx, scene)
	if !comparePerformers(input.Performers, performers) {
		s.fieldMismatch(input.Performers, performers, "Performers")
	}

	tags, _ := s.resolver.Scene().Tags(s.ctx, scene)
	if !compareTags(input.TagIds, tags) {
		s.fieldMismatch(input.TagIds, tags, "Tags")
	}
}

func (s *sceneTestRunner) testDestroyScene() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneID := strconv.FormatInt(createdScene.ID, 10)

	destroyed, err := s.resolver.Mutation().SceneDestroy(s.ctx, models.SceneDestroyInput{
		ID: sceneID,
	})
	if err != nil {
		s.t.Errorf("Error destroying scene: %s", err.Error())
		return
	}

	if !destroyed {
		s.t.Error("Scene was not destroyed")
		return
	}

	// ensure cannot find scene
	foundScene, err := s.resolver.Query().FindScene(s.ctx, &sceneID, nil)
	if err != nil {
		s.t.Errorf("Error finding scene after destroying: %s", err.Error())
		return
	}

	if foundScene != nil {
		s.t.Error("Found scene after destruction")
	}

	// TODO - ensure scene was not removed
}

func TestCreateScene(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testCreateScene()
}

func TestFindSceneById(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindSceneById()
}

func TestFindSceneByChecksum(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindSceneByChecksum()
}

func TestUpdateScene(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testUpdateScene()
}

func TestUpdateSceneTitle(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testUpdateSceneTitle()
}

func TestDestroyScene(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testDestroyScene()
}
