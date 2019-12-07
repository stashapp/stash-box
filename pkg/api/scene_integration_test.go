// +build integration

package api_test

import (
	"reflect"
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

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Fingerprints: []*models.FingerprintInput{
			s.generateSceneFingerprint(),
			s.generateSceneFingerprint(),
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
		performerID := v.Performer.ID.String()
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
		tagID := v.ID.String()
		if tagID != tagIDs[i] {
			return false
		}
	}

	return true
}

func compareFingerprints(input []*models.FingerprintInput, fingerprints []*models.Fingerprint) bool {
	if len(input) != len(fingerprints) {
		return false
	}

	for i, v := range fingerprints {
		if input[i].Algorithm != v.Algorithm || input[i].Hash != v.Hash {
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

	if v, _ := r.Fingerprints(s.ctx, scene); !compareFingerprints(input.Fingerprints, v) {
		s.fieldMismatch(input.Fingerprints, v, "Fingerprints")
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

	sceneID := createdScene.ID.String()
	scene, err := s.resolver.Query().FindScene(s.ctx, sceneID)
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

func (s *sceneTestRunner) testFindSceneByFingerprint() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	fingerprints, err := s.resolver.Scene().Fingerprints(s.ctx, createdScene)
	fingerprint := models.FingerprintInput{
		Algorithm: fingerprints[0].Algorithm,
		Hash:      fingerprints[0].Hash,
	}
	scenes, err := s.resolver.Query().FindSceneByFingerprint(s.ctx, fingerprint)
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// ensure returned scene is not nil
	if len(scenes) == 0 {
		s.t.Error("Did not find scene by fingerprint")
		return
	}

	// ensure values were set
	if createdScene.Title != scenes[0].Title {
		s.fieldMismatch(createdScene.Title, scenes[0].Title, "Title")
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

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Fingerprints: []*models.FingerprintInput{
			s.generateSceneFingerprint(),
			s.generateSceneFingerprint(),
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

	sceneID := createdScene.ID.String()

	newTitle := "NewTitle"
	newDetails := "NewDetails"
	newURL := "NewURL"
	newDate := "2001-02-03"

	performer, _ = s.createTestPerformer(nil)
	studio, _ = s.createTestScene(nil)
	tag, _ = s.createTestTag(nil)

	performerID = performer.ID.String()
	studioID = studio.ID.String()
	tagID = tag.ID.String()

	performerAlias = "updatedAlias"

	updateInput := models.SceneUpdateInput{
		ID:      sceneID,
		Title:   &newTitle,
		Details: &newDetails,
		URL:     &newURL,
		Date:    &newDate,
		Fingerprints: []*models.FingerprintInput{
			s.generateSceneFingerprint(),
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
		"fingerprints",
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

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		URL:     &url,
		Date:    &date,
		Fingerprints: []*models.FingerprintInput{
			s.generateSceneFingerprint(),
			s.generateSceneFingerprint(),
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

	sceneID := createdScene.ID.String()
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

	if v, _ := r.Fingerprints(s.ctx, scene); !compareFingerprints(input.Fingerprints, v) {
		s.fieldMismatch(input.Fingerprints, v, "Fingerprints")
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

	sceneID := createdScene.ID.String()

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
	foundScene, err := s.resolver.Query().FindScene(s.ctx, sceneID)
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

func TestFindSceneByFingerprint(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindSceneByFingerprint()
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
