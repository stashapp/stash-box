//go:build integration
// +build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type sceneTestRunner struct {
	testRunner
}

func createSceneTestRunner(t *testing.T) *sceneTestRunner {
	return &sceneTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *sceneTestRunner) testCreateScene() {
	title := "Title"
	details := "Details"
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)
	site, _ := s.createTestSite(nil)

	performerID := performer.UUID()
	studioID := studio.UUID()
	tagID := tag.UUID()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		Date:    &date,
		Fingerprints: []*models.FingerprintEditInput{
			s.generateSceneFingerprint(nil),
		},
		StudioID: &studioID,
		Performers: []*models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []*models.URLInput{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		TagIds: []uuid.UUID{
			tagID,
		},
	}

	scene, err := s.client.createScene(input)

	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return
	}

	s.verifyCreatedScene(input, scene)
}

func comparePerformers(input []*models.PerformerAppearanceInput, performers []*performerAppearance) bool {
	if len(performers) != len(input) {
		return false
	}

	for i, v := range performers {
		performerID := v.Performer.ID
		if performerID != input[i].PerformerID.String() {
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

func comparePerformersInput(input, performers []*models.PerformerAppearanceInput) bool {
	if len(performers) != len(input) {
		return false
	}

	for i, v := range performers {
		performerID := v.PerformerID
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

func compareTags(tagIDs []uuid.UUID, tags []*idObject) bool {
	if len(tags) != len(tagIDs) {
		return false
	}

	for i, v := range tags {
		tagID := v.ID
		if tagID != tagIDs[i].String() {
			return false
		}
	}

	return true
}

func compareFingerprints(input []*models.FingerprintEditInput, fingerprints []*fingerprint) bool {
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

func compareFingerprintsInput(input, fingerprints []*models.FingerprintEditInput) bool {
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

func (s *sceneTestRunner) verifyCreatedScene(input models.SceneCreateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	if scene.ID == "" {
		s.t.Errorf("Expected created scene id to be non-zero")
	}

	if !reflect.DeepEqual(scene.Title, input.Title) {
		s.fieldMismatch(*input.Title, scene.Title, "Title")
	}

	if !reflect.DeepEqual(scene.Details, input.Details) {
		s.fieldMismatch(input.Details, scene.Details, "Details")
	}

	s.compareSiteURLs(input.Urls, scene.Urls)

	if !reflect.DeepEqual(scene.Date, input.Date) {
		s.fieldMismatch(*input.Date, scene.Date, "Date")
	}

	if !compareFingerprints(input.Fingerprints, scene.Fingerprints) {
		s.fieldMismatch(input.Fingerprints, scene.Fingerprints, "Fingerprints")
	}

	if !comparePerformers(input.Performers, scene.Performers) {
		s.fieldMismatch(input.Performers, scene.Performers, "Performers")
	}

	if !compareTags(input.TagIds, scene.Tags) {
		s.fieldMismatch(input.TagIds, scene.Tags, "Tags")
	}
}

func (s *sceneTestRunner) testFindSceneById() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	scene, err := s.client.findScene(createdScene.UUID())

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
	if *createdScene.Title != *scene.Title {
		s.fieldMismatch(createdScene.Title, scene.Title, "Title")
	}
}

func (s *sceneTestRunner) testFindSceneByFingerprint() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		s.t.Errorf("Error creating scene: %s", err.Error())
		return
	}

	fingerprints := createdScene.Fingerprints
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}
	fingerprint := models.FingerprintQueryInput{
		Algorithm: fingerprints[0].Algorithm,
		Hash:      fingerprints[0].Hash,
	}

	scenes, err := s.client.findSceneByFingerprint(fingerprint)
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
	if *createdScene.Title != *scenes[0].Title {
		s.fieldMismatch(createdScene.Title, scenes[0].Title, "Title")
	}
}

func (s *sceneTestRunner) testFindScenesByFingerprints() {
	scene1Title := "asdasd"
	scene1Input := models.SceneCreateInput{
		Title: &scene1Title,
		Fingerprints: []*models.FingerprintEditInput{
			s.generateSceneFingerprint(nil),
		},
	}
	createdScene1, err := s.createTestScene(&scene1Input)
	if err != nil {
		return
	}
	createdScene2, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	fingerprintList := []string{}
	fingerprints := createdScene1.Fingerprints
	fingerprintList = append(fingerprintList, fingerprints[0].Hash)
	fingerprints = createdScene2.Fingerprints
	fingerprintList = append(fingerprintList, fingerprints[0].Hash)

	scenes, err := s.client.findScenesByFingerprints(fingerprintList)
	if err != nil {
		s.t.Errorf("Error finding scenes: %s", err.Error())
		return
	}

	// ensure only two scenes are returned
	if len(scenes) != 2 {
		s.t.Error("Did not get correct amount of scenes by fingerprint")
		return
	}

	// ensure values were set
	if *createdScene1.Title != *scenes[0].Title {
		s.fieldMismatch(createdScene1.Title, scenes[0].Title, "Title")
	}
	if *createdScene2.Title != *scenes[1].Title {
		s.fieldMismatch(createdScene2.Title, scenes[1].Title, "Title")
	}
}

func (s *sceneTestRunner) testUpdateScene() {
	title := "Title"
	details := "Details"
	date := "2003-02-01"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)
	site, _ := s.createTestSite(nil)

	performerID := performer.UUID()
	studioID := studio.UUID()
	tagID := tag.UUID()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:   &title,
		Details: &details,
		Date:    &date,
		Fingerprints: []*models.FingerprintEditInput{
			// fingerprint that will be kept
			s.generateSceneFingerprint([]uuid.UUID{
				userDB.none.ID,
				userDB.admin.ID,
			}),
			// fingerprint that will be removed
			s.generateSceneFingerprint(nil),
		},
		StudioID: &studioID,
		Performers: []*models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []*models.URLInput{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		TagIds: []uuid.UUID{
			tagID,
		},
	}

	createdScene, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	newTitle := "NewTitle"
	newDetails := "NewDetails"
	newDate := "2001-02-03"

	performer, _ = s.createTestPerformer(nil)
	studio, _ = s.createTestStudio(nil)
	tag, _ = s.createTestTag(nil)
	site, _ = s.createTestSite(nil)

	performerID = performer.UUID()
	studioID = studio.UUID()
	tagID = tag.UUID()

	performerAlias = "updatedAlias"

	sceneID := createdScene.UUID()
	updateInput := models.SceneUpdateInput{
		ID:      sceneID,
		Title:   &newTitle,
		Details: &newDetails,
		Date:    &newDate,
		Fingerprints: []*models.FingerprintEditInput{
			input.Fingerprints[0],
			s.generateSceneFingerprint(nil),
		},
		Performers: []*models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []*models.URLInput{
			{
				URL:    "URL",
				SiteID: site.ID,
			},
		},
		StudioID: &studioID,
		TagIds: []uuid.UUID{
			tagID,
		},
	}

	scene, err := s.client.updateScene(updateInput)
	if err != nil {
		s.t.Errorf("Error updating scene: %s", err.Error())
		return
	}

	s.verifyUpdatedScene(updateInput, scene)

	// ensure fingerprint changes were enacted
	s.verifyUpdatedFingerprints(input.Fingerprints, updateInput.Fingerprints, scene)

	// ensure submissions count was maintained
	originalFP := input.Fingerprints[0]
	foundFP := false
	for _, f := range scene.Fingerprints {
		if originalFP.Algorithm == f.Algorithm && originalFP.Hash == f.Hash {
			foundFP = true
			if f.Submissions != 2 {
				s.t.Errorf("Incorrect fingerprint submissions count: %d", f.Submissions)
			}
		}
	}

	if !foundFP {
		s.t.Error("Could not find original fingerprint")
	}
}

func (s *sceneTestRunner) verifyUpdatedScene(input models.SceneUpdateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	if !reflect.DeepEqual(scene.Title, input.Title) {
		s.fieldMismatch(input.Title, scene.Title, "Title")
	}

	if !reflect.DeepEqual(scene.Details, input.Details) {
		s.fieldMismatch(input.Details, scene.Details, "Details")
	}

	if !reflect.DeepEqual(scene.Date, input.Date) {
		s.fieldMismatch(input.Date, scene.Date, "Date")
	}

	s.compareSiteURLs(input.Urls, scene.Urls)

	if !comparePerformers(input.Performers, scene.Performers) {
		s.fieldMismatch(input.Performers, scene.Performers, "Performers")
	}

	if !compareTags(input.TagIds, scene.Tags) {
		s.fieldMismatch(input.TagIds, scene.Tags, "Tags")
	}
}

func (s *sceneTestRunner) verifyUpdatedFingerprints(original, updated []*models.FingerprintEditInput, scene *sceneOutput) {
	hashExists := func(h *models.FingerprintEditInput, vs []*models.FingerprintEditInput) bool {
		for _, v := range vs {
			if h.Algorithm == v.Algorithm && h.Hash == v.Hash {
				return true
			}
		}

		return false
	}

	inOutput := func(h *models.FingerprintEditInput) bool {
		for _, hh := range scene.Fingerprints {
			if hh.Algorithm == h.Algorithm && hh.Hash == h.Hash {
				return true
			}
		}

		return false
	}

	for _, o := range original {
		// find in updated
		if hashExists(o, updated) {
			// exists, so ensure hash exists in output
			if !inOutput(o) {
				s.t.Errorf("existing hash %s missing in output", o.Hash)
			}
		} else {
			// not exists, ensure not in output
			if inOutput(o) {
				s.t.Errorf("removed hash %s still in output", o.Hash)
			}
		}
	}

	for _, u := range updated {
		// find in original
		if !hashExists(u, original) {
			// new hash, ensure in output
			if !inOutput(u) {
				s.t.Errorf("new hash %s missing in output", u.Hash)
			}
		}
	}
}

func (s *sceneTestRunner) testDestroyScene() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	sceneID := createdScene.UUID()

	destroyed, err := s.client.destroyScene(models.SceneDestroyInput{
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
	foundScene, err := s.client.findScene(sceneID)
	if err != nil {
		s.t.Errorf("Error finding scene after destroying: %s", err.Error())
		return
	}

	if foundScene != nil {
		s.t.Error("Found scene after destruction")
	}

	// TODO - ensure scene was not removed
}

func (s *sceneTestRunner) testSubmitFingerprint() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	fp := s.generateSceneFingerprint(nil)

	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	scene, err := s.client.findScene(createdScene.UUID())
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// verify created fingerprint
	expected := fingerprint{
		Hash:        fp.Hash,
		Algorithm:   fp.Algorithm,
		Duration:    fp.Duration,
		Submissions: 1,
	}
	actualFP := scene.Fingerprints[1]
	actual := fingerprint{
		Hash:        actualFP.Hash,
		Algorithm:   actualFP.Algorithm,
		Duration:    actualFP.Duration,
		Submissions: actualFP.Submissions,
	}
	if !reflect.DeepEqual(actual, expected) {
		s.fieldMismatch(expected, *scene.Fingerprints[1], "fingerprints")
	}

	// submit the same fingerprint - should not add and should not error
	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatch() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	unmatch := true
	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      createdScene.Fingerprints[0].Hash,
			Algorithm: createdScene.Fingerprints[0].Algorithm,
			Duration:  createdScene.Fingerprints[0].Duration,
		},
		Unmatch: &unmatch,
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	scene, err := s.client.findScene(createdScene.UUID())
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	if len(scene.Fingerprints) > 0 {
		s.fieldMismatch([]*fingerprint{}, scene.Fingerprints, "fingerprints")
	}
}

func (s *sceneTestRunner) testSubmitFingerprintModify() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	fp := s.generateSceneFingerprint(nil)

	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
			UserIds: []uuid.UUID{
				userDB.edit.ID,
				userDB.none.ID,
				userDB.read.ID,
			},
		},
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	scene, err := s.client.findScene(createdScene.UUID())
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// verify created fingerprint
	expected := fingerprint{
		Hash:        fp.Hash,
		Algorithm:   fp.Algorithm,
		Duration:    fp.Duration,
		Submissions: 3,
	}
	actualFP := scene.Fingerprints[0]
	actual := fingerprint{
		Hash:        actualFP.Hash,
		Algorithm:   actualFP.Algorithm,
		Duration:    actualFP.Duration,
		Submissions: actualFP.Submissions,
	}
	if !reflect.DeepEqual(actual, expected) {
		s.fieldMismatch(expected, *scene.Fingerprints[0], "fingerprints")
	}

	// submit the same fingerprint - should add
	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	scene, err = s.client.findScene(createdScene.UUID())
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	expected.Submissions = 4
	actual.Submissions = scene.Fingerprints[0].Submissions

	if !reflect.DeepEqual(actual, expected) {
		s.fieldMismatch(expected, *scene.Fingerprints[0], "fingerprints")
	}
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatchModify() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	fp := s.generateSceneFingerprint(nil)

	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
			UserIds: []uuid.UUID{
				userDB.edit.ID,
				userDB.none.ID,
				userDB.read.ID,
			},
		},
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	unmatch := true
	if _, err := s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
			UserIds: []uuid.UUID{
				userDB.edit.ID,
			},
		},
		Unmatch: &unmatch,
	}); err != nil {
		s.t.Errorf("Error submitting fingerprint: %s", err.Error())
		return
	}

	scene, err := s.client.findScene(createdScene.UUID())
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	expected := fingerprint{
		Hash:        fp.Hash,
		Algorithm:   fp.Algorithm,
		Duration:    fp.Duration,
		Submissions: 2,
	}
	actualFP := scene.Fingerprints[0]
	actual := fingerprint{
		Hash:        actualFP.Hash,
		Algorithm:   actualFP.Algorithm,
		Duration:    actualFP.Duration,
		Submissions: actualFP.Submissions,
	}
	if !reflect.DeepEqual(actual, expected) {
		s.fieldMismatch(expected, *scene.Fingerprints[0], "fingerprints")
	}
}

func (s *sceneTestRunner) verifyQueryScenesResult(filter models.SceneFilterType, ids []uuid.UUID) {
	s.t.Helper()

	page := 1
	pageSize := 10
	querySpec := models.QuerySpec{
		Page:    &page,
		PerPage: &pageSize,
	}

	results, err := s.client.queryScenes(&filter, &querySpec)
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
			if scene.ID == id.String() {
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

	resolver, _ := s.resolver.Query().QueryScenes(s.ctx, &filter, &querySpec)
	_, err := s.resolver.QueryScenesResultType().Scenes(s.ctx, resolver)

	if err == nil {
		s.t.Error("Expected error for invalid modifier")
	}
}

func (s *sceneTestRunner) testQueryScenesByStudio() {
	studio1, _ := s.createTestStudio(nil)
	studio2, _ := s.createTestStudio(nil)

	studio1ID := studio1.UUID()
	studio2ID := studio2.UUID()

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

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	// test equals
	filter := models.SceneFilterType{
		Studios: &models.MultiIDCriterionInput{
			Value:    []uuid.UUID{studio1ID},
			Modifier: models.CriterionModifierEquals,
		},
	}

	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID})

	filter.Studios.Modifier = models.CriterionModifierNotEquals
	filter.Title = &scene2Title
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene2ID})

	filter.Studios.Modifier = models.CriterionModifierIsNull
	filter.Title = &scene3Title
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene3ID})

	filter.Studios.Modifier = models.CriterionModifierNotNull
	filter.Title = &scene1Title
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID})

	filter.Studios.Modifier = models.CriterionModifierIncludes
	filter.Studios.Value = []uuid.UUID{studio1ID, studio2ID}
	filter.Title = nil
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID, scene2ID})

	filter.Studios.Modifier = models.CriterionModifierExcludes
	filter.Studios.Value = []uuid.UUID{studio1ID}
	filter.Title = &scene2Title
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene2ID})

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

	performer1ID := performer1.UUID()
	performer2ID := performer2.UUID()

	prefix := "testQueryScenesByPerformer_"
	scene1Title := prefix + "scene1Title"
	scene2Title := prefix + "scene2Title"
	scene3Title := prefix + "scene3Title"

	input := models.SceneCreateInput{
		Performers: []*models.PerformerAppearanceInput{
			{
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

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	titleSearch := prefix
	filter := models.SceneFilterType{
		Performers: &models.MultiIDCriterionInput{
			Value:    []uuid.UUID{performer1ID},
			Modifier: models.CriterionModifierIncludes,
		},
		Title: &titleSearch,
	}

	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID, scene3ID})

	filter.Performers.Modifier = models.CriterionModifierExcludes
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene2ID})

	filter.Performers.Modifier = models.CriterionModifierIncludesAll
	filter.Performers.Value = append(filter.Performers.Value, performer2ID)
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene3ID})

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

	tag1ID := tag1.UUID()
	tag2ID := tag2.UUID()

	prefix := "testQueryScenesByTag_"
	scene1Title := prefix + "scene1Title"
	scene2Title := prefix + "scene2Title"
	scene3Title := prefix + "scene3Title"

	input := models.SceneCreateInput{
		TagIds: []uuid.UUID{
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

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	titleSearch := prefix
	filter := models.SceneFilterType{
		Tags: &models.MultiIDCriterionInput{
			Value:    []uuid.UUID{tag1ID},
			Modifier: models.CriterionModifierIncludes,
		},
		Title: &titleSearch,
	}

	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID, scene3ID})

	filter.Tags.Modifier = models.CriterionModifierExcludes
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene2ID})

	filter.Tags.Modifier = models.CriterionModifierIncludesAll
	filter.Tags.Value = append(filter.Tags.Value, tag2ID)
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene3ID})

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

func TestFindScenesByFingerprints(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindScenesByFingerprints()
}

func TestUpdateScene(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testUpdateScene()
}

// TestUpdateSceneTitle is removed due to no longer allowing
// partial updates

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

func TestSubmitFingerprint(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testSubmitFingerprint()
}

func TestSubmitFingerprintUnmatch(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testSubmitFingerprintUnmatch()
}

func TestSubmitFingerprintModify(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testSubmitFingerprintModify()
}

func TestSubmitFingerprintUnmatchModify(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testSubmitFingerprintUnmatchModify()
}
