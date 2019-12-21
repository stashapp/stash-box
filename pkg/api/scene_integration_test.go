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
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
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
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
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

func compareUrls(input []*models.URLInput, urls []*models.URL) bool {
	if len(urls) != len(input) {
		return false
	}

	for i, v := range urls {
		if v.URL != input[i].URL || v.Type != input[i].Type {
			return false
		}
	}

	return true
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

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	if !compareUrls(input.Urls, urls) {
		s.fieldMismatch(input.Urls, urls, "Urls")
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
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
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
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
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
	newDate := "2001-02-03"

	performer, _ = s.createTestPerformer(nil)
	studio, _ = s.createTestStudio(nil)
	tag, _ = s.createTestTag(nil)

	performerID = performer.ID.String()
	studioID = studio.ID.String()
	tagID = tag.ID.String()

	performerAlias = "updatedAlias"

	updateInput := models.SceneUpdateInput{
		ID:      sceneID,
		Title:   &newTitle,
		Details: &newDetails,
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
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
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
		"urls",
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
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)

	performerID := performer.ID.String()
	studioID := studio.ID.String()
	tagID := tag.ID.String()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
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
		Urls: []*models.URLInput{
			&models.URLInput{
				URL:  "URL",
				Type: "Type",
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

	if v, _ := r.Date(s.ctx, scene); !reflect.DeepEqual(v, input.Date) {
		s.fieldMismatch(input.Date, v, "Date")
	}

	if v, _ := r.Fingerprints(s.ctx, scene); !compareFingerprints(input.Fingerprints, v) {
		s.fieldMismatch(input.Fingerprints, v, "Fingerprints")
	}

	// ensure urls were set correctly
	urls, _ := s.resolver.Performer().Urls(s.ctx, performer)
	if !compareUrls(input.Urls, urls) {
		s.fieldMismatch(input.Urls, urls, "Urls")
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

func (s *sceneTestRunner) verifyQueryScenesResult(filter models.SceneFilterType, ids []string) {
	s.t.Helper()

	page := 1
	pageSize := 10
	querySpec := models.QuerySpec{
		Page:    &page,
		PerPage: &pageSize,
	}

	results, err := s.resolver.Query().QueryScenes(s.ctx, &filter, &querySpec)
	if err != nil {
		s.t.Errorf("Error querying scenes: %s", err.Error())
		return
	}

	if results.Count != len(ids) {
		s.t.Errorf("Expected %d query result, got %d", len(ids), results.Count)
		return
	}

	for _, id := range ids {
		found := false
		for _, scene := range results.Scenes {
			if scene.ID.String() == id {
				found = true
				break
			}
		}

		if !found {
			s.t.Errorf("Missing scene with ID %s, got %v", id, results.Scenes)
			return
		}
	}
}

func (s *sceneTestRunner) verifyInvalidModifier(filter models.SceneFilterType) {
	s.t.Helper()

	page := 1
	pageSize := 10
	querySpec := models.QuerySpec{
		Page:    &page,
		PerPage: &pageSize,
	}

	defer func() {
		if r := recover(); r != nil {
			// success
		} else {
			s.t.Error("Expected error for invalid modifier")
		}
	}()
	s.resolver.Query().QueryScenes(s.ctx, &filter, &querySpec)
}

func (s *sceneTestRunner) testQueryScenesByStudio() {
	studio1, _ := s.createTestStudio(nil)
	studio2, _ := s.createTestStudio(nil)

	studio1ID := studio1.ID.String()
	studio2ID := studio2.ID.String()

	prefix := "testQueryScenesByStudio_"
	scene1Title := prefix + "scene1Title"
	scene2Title := prefix + "scene2Title"
	scene3Title := prefix + "scene3Title"

	input := models.SceneCreateInput{
		StudioID: &studio1ID,
		Title:    &scene1Title,
	}

	scene1, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.StudioID = &studio2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.StudioID = nil
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	scene1ID := scene1.ID.String()
	scene2ID := scene2.ID.String()
	scene3ID := scene3.ID.String()

	// test equals
	filter := models.SceneFilterType{
		Studios: &models.MultiIDCriterionInput{
			Value:    []string{studio1ID},
			Modifier: models.CriterionModifierEquals,
		},
	}

	s.verifyQueryScenesResult(filter, []string{scene1ID})

	filter.Studios.Modifier = models.CriterionModifierNotEquals
	filter.Title = &scene2Title
	s.verifyQueryScenesResult(filter, []string{scene2ID})

	filter.Studios.Modifier = models.CriterionModifierIsNull
	filter.Title = &scene3Title
	s.verifyQueryScenesResult(filter, []string{scene3ID})

	filter.Studios.Modifier = models.CriterionModifierNotNull
	filter.Title = &scene1Title
	s.verifyQueryScenesResult(filter, []string{scene1ID})

	filter.Studios.Modifier = models.CriterionModifierIncludes
	filter.Studios.Value = []string{studio1ID, studio2ID}
	filter.Title = nil
	s.verifyQueryScenesResult(filter, []string{scene1ID, scene2ID})

	filter.Studios.Modifier = models.CriterionModifierExcludes
	filter.Studios.Value = []string{studio1ID}
	filter.Title = &scene2Title
	s.verifyQueryScenesResult(filter, []string{scene2ID})

	// test invalid modifiers
	filter.Studios.Modifier = models.CriterionModifierGreaterThan
	s.verifyInvalidModifier(filter)

	filter.Studios.Modifier = models.CriterionModifierLessThan
	s.verifyInvalidModifier(filter)

	filter.Studios.Modifier = models.CriterionModifierIncludesAll
	s.verifyInvalidModifier(filter)
}

func (s *sceneTestRunner) testQueryScenesByPerformer() {
	performer1, _ := s.createTestPerformer(nil)
	performer2, _ := s.createTestPerformer(nil)

	performer1ID := performer1.ID.String()
	performer2ID := performer2.ID.String()

	prefix := "testQueryScenesByPerformer_"
	scene1Title := prefix + "scene1Title"
	scene2Title := prefix + "scene2Title"
	scene3Title := prefix + "scene3Title"

	input := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			&models.PerformerAppearanceInput{
				PerformerID: performer1ID,
			},
		},
		Title: &scene1Title,
	}

	scene1, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.Performers[0].PerformerID = performer2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.Performers = append(input.Performers, &models.PerformerAppearanceInput{
		PerformerID: performer1ID,
	})
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	scene1ID := scene1.ID.String()
	scene2ID := scene2.ID.String()
	scene3ID := scene3.ID.String()

	titleSearch := prefix
	filter := models.SceneFilterType{
		Performers: &models.MultiIDCriterionInput{
			Value:    []string{performer1ID},
			Modifier: models.CriterionModifierIncludes,
		},
		Title: &titleSearch,
	}

	s.verifyQueryScenesResult(filter, []string{scene1ID, scene3ID})

	filter.Performers.Modifier = models.CriterionModifierExcludes
	s.verifyQueryScenesResult(filter, []string{scene2ID})

	filter.Performers.Modifier = models.CriterionModifierIncludesAll
	filter.Performers.Value = append(filter.Performers.Value, performer2ID)
	s.verifyQueryScenesResult(filter, []string{scene3ID})

	// test invalid modifiers
	filter.Performers.Modifier = models.CriterionModifierGreaterThan
	s.verifyInvalidModifier(filter)

	filter.Performers.Modifier = models.CriterionModifierLessThan
	s.verifyInvalidModifier(filter)

	filter.Performers.Modifier = models.CriterionModifierEquals
	s.verifyInvalidModifier(filter)

	filter.Performers.Modifier = models.CriterionModifierNotEquals
	s.verifyInvalidModifier(filter)

	filter.Performers.Modifier = models.CriterionModifierIsNull
	s.verifyInvalidModifier(filter)

	filter.Performers.Modifier = models.CriterionModifierNotNull
	s.verifyInvalidModifier(filter)
}

func (s *sceneTestRunner) testQueryScenesByTag() {
	tag1, _ := s.createTestTag(nil)
	tag2, _ := s.createTestTag(nil)

	tag1ID := tag1.ID.String()
	tag2ID := tag2.ID.String()

	prefix := "testQueryScenesByTag_"
	scene1Title := prefix + "scene1Title"
	scene2Title := prefix + "scene2Title"
	scene3Title := prefix + "scene3Title"

	input := models.SceneCreateInput{
		TagIds: []string{
			tag1ID,
		},
		Title: &scene1Title,
	}

	scene1, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.TagIds[0] = tag2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	input.TagIds = append(input.TagIds, tag1ID)
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	scene1ID := scene1.ID.String()
	scene2ID := scene2.ID.String()
	scene3ID := scene3.ID.String()

	titleSearch := prefix
	filter := models.SceneFilterType{
		Tags: &models.MultiIDCriterionInput{
			Value:    []string{tag1ID},
			Modifier: models.CriterionModifierIncludes,
		},
		Title: &titleSearch,
	}

	s.verifyQueryScenesResult(filter, []string{scene1ID, scene3ID})

	filter.Tags.Modifier = models.CriterionModifierExcludes
	s.verifyQueryScenesResult(filter, []string{scene2ID})

	filter.Tags.Modifier = models.CriterionModifierIncludesAll
	filter.Tags.Value = append(filter.Tags.Value, tag2ID)
	s.verifyQueryScenesResult(filter, []string{scene3ID})

	// test invalid modifiers
	filter.Tags.Modifier = models.CriterionModifierGreaterThan
	s.verifyInvalidModifier(filter)

	filter.Tags.Modifier = models.CriterionModifierLessThan
	s.verifyInvalidModifier(filter)

	filter.Tags.Modifier = models.CriterionModifierEquals
	s.verifyInvalidModifier(filter)

	filter.Tags.Modifier = models.CriterionModifierNotEquals
	s.verifyInvalidModifier(filter)

	filter.Tags.Modifier = models.CriterionModifierIsNull
	s.verifyInvalidModifier(filter)

	filter.Tags.Modifier = models.CriterionModifierNotNull
	s.verifyInvalidModifier(filter)
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

func TestQueryScenesByStudio(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testQueryScenesByStudio()
}

func TestQueryScenesByPerformer(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testQueryScenesByPerformer()
}

func TestQueryScenesByTag(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testQueryScenesByTag()
}
