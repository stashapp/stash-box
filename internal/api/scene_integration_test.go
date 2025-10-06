//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"gotest.tools/v3/assert"
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
	production_date := "2003-03-09"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)
	site, _ := s.createTestSite(nil)

	performerID := performer.UUID()
	studioID := studio.UUID()
	tagID := tag.UUID()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:          &title,
		Details:        &details,
		Date:           date,
		ProductionDate: &production_date,
		Fingerprints: []models.FingerprintEditInput{
			s.generateSceneFingerprint(nil),
		},
		StudioID: &studioID,
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []models.URL{
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
	assert.NilError(s.t, err)

	s.verifyCreatedScene(input, scene)
}

func (s *sceneTestRunner) verifyCreatedScene(input models.SceneCreateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, scene.ID != "", "Expected created scene id to be non-zero")

	assert.DeepEqual(s.t, scene.Title, input.Title)
	assert.DeepEqual(s.t, scene.Details, input.Details)

	s.compareSiteURLs(input.Urls, scene.Urls)

	assert.Assert(s.t, bothNil(scene.Date, input.Date) || (!oneNil(scene.Date, input.Date) && input.Date == *scene.Date))
	assert.Assert(s.t, bothNil(scene.ProductionDate, input.ProductionDate) || (!oneNil(scene.ProductionDate, input.ProductionDate) && *input.ProductionDate == *scene.ProductionDate))
	assert.Assert(s.t, compareFingerprints(input.Fingerprints, scene.Fingerprints))
	assert.Assert(s.t, comparePerformers(input.Performers, scene.Performers))
	assert.Assert(s.t, compareTags(input.TagIds, scene.Tags))
}

func (s *sceneTestRunner) testFindSceneById() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err)

	// ensure returned scene is not nil
	assert.Assert(s.t, scene != nil, "Did not find scene by id")

	// ensure values were set
	assert.Equal(s.t, *createdScene.Title, *scene.Title)
}

func (s *sceneTestRunner) testFindSceneByFingerprint() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	fingerprints := createdScene.Fingerprints
	assert.NilError(s.t, err)

	fingerprint := models.FingerprintQueryInput{
		Algorithm: fingerprints[0].Algorithm,
		Hash:      fingerprints[0].Hash,
	}

	scenes, err := s.client.findSceneByFingerprint(fingerprint)
	assert.NilError(s.t, err)

	// ensure returned scene is not nil
	assert.Assert(s.t, len(scenes) > 0)
	assert.Equal(s.t, *createdScene.Title, *scenes[0].Title)
}

func (s *sceneTestRunner) testFindScenesByFingerprints() {
	scene1Title := "asdasd"
	scene1Input := models.SceneCreateInput{
		Title: &scene1Title,
		Fingerprints: []models.FingerprintEditInput{
			s.generateSceneFingerprint(nil),
		},
		Date: "2020-03-02",
	}
	createdScene1, err := s.createTestScene(&scene1Input)
	assert.NilError(s.t, err)

	createdScene2, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	fingerprintList := []string{}
	fingerprints := createdScene1.Fingerprints
	fingerprintList = append(fingerprintList, fingerprints[0].Hash)
	fingerprints = createdScene2.Fingerprints
	fingerprintList = append(fingerprintList, fingerprints[0].Hash)

	scenes, err := s.client.findScenesByFingerprints(fingerprintList)
	assert.NilError(s.t, err)

	// ensure only two scenes are returned
	assert.Equal(s.t, len(scenes), 2, "Did not get correct amount of scenes by fingerprint")

	// ensure values were set
	assert.Equal(s.t, *createdScene1.Title, *scenes[0].Title)
	assert.Equal(s.t, *createdScene2.Title, *scenes[1].Title)
}

func (s *sceneTestRunner) testUpdateScene() {
	title := "Title"
	details := "Details"
	date := "2003-02-01"
	production_date := "2003-01-30"

	performer, _ := s.createTestPerformer(nil)
	studio, _ := s.createTestStudio(nil)
	tag, _ := s.createTestTag(nil)
	site, _ := s.createTestSite(nil)

	performerID := performer.UUID()
	studioID := studio.UUID()
	tagID := tag.UUID()

	performerAlias := "alias"

	input := models.SceneCreateInput{
		Title:          &title,
		Details:        &details,
		Date:           date,
		ProductionDate: &production_date,
		Fingerprints: []models.FingerprintEditInput{
			// fingerprint that will be kept
			s.generateSceneFingerprint([]uuid.UUID{
				userDB.none.ID,
				userDB.admin.ID,
			}),
			// fingerprint that will be removed
			s.generateSceneFingerprint(nil),
		},
		StudioID: &studioID,
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []models.URL{
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
	assert.NilError(s.t, err)

	newTitle := "NewTitle"
	newDetails := "NewDetails"
	newDate := "2001-02-03"
	newProductionDate := "2001-02-01"

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
		ID:             sceneID,
		Title:          &newTitle,
		Details:        &newDetails,
		Date:           &newDate,
		ProductionDate: &newProductionDate,
		Fingerprints: []models.FingerprintEditInput{
			input.Fingerprints[0],
			s.generateSceneFingerprint(nil),
		},
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performerID,
				As:          &performerAlias,
			},
		},
		Urls: []models.URL{
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
	assert.NilError(s.t, err)

	s.verifyUpdatedScene(updateInput, scene)

	// ensure fingerprint changes were enacted
	s.verifyUpdatedFingerprints(input.Fingerprints, updateInput.Fingerprints, scene)

	// ensure submissions count was maintained
	originalFP := input.Fingerprints[0]
	foundFP := false
	for _, f := range scene.Fingerprints {
		if originalFP.Algorithm == f.Algorithm && originalFP.Hash == f.Hash {
			foundFP = true
			assert.Equal(s.t, f.Submissions, 2, "Incorrect fingerprint submissions count")
		}
	}

	assert.Assert(s.t, foundFP, "Could not find original fingerprint")
}

func (s *sceneTestRunner) verifyUpdatedScene(input models.SceneUpdateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	assert.DeepEqual(s.t, scene.Title, input.Title)
	assert.DeepEqual(s.t, scene.Details, input.Details)

	assert.Assert(s.t, bothNil(scene.Date, input.Date) || (!oneNil(scene.Date, input.Date) && *scene.Date == *input.Date))
	assert.Assert(s.t, bothNil(scene.ProductionDate, input.ProductionDate) || (!oneNil(scene.ProductionDate, input.ProductionDate) && *scene.ProductionDate == *input.ProductionDate))

	s.compareSiteURLs(input.Urls, scene.Urls)

	assert.Assert(s.t, comparePerformers(input.Performers, scene.Performers))
	assert.Assert(s.t, compareTags(input.TagIds, scene.Tags))
}

func (s *sceneTestRunner) verifyUpdatedFingerprints(original, updated []models.FingerprintEditInput, scene *sceneOutput) {
	hashExists := func(h models.FingerprintEditInput, vs []models.FingerprintEditInput) bool {
		for _, v := range vs {
			if h.Algorithm == v.Algorithm && h.Hash == v.Hash {
				return true
			}
		}

		return false
	}

	inOutput := func(h models.FingerprintEditInput) bool {
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
			assert.Assert(s.t, inOutput(o), "existing hash s missing in output")
		} else {
			// not exists, ensure not in output
			assert.Assert(s.t, !inOutput(o), "removed hash %s still in output")
		}
	}

	for _, u := range updated {
		// find in original
		if !hashExists(u, original) {
			// new hash, ensure in output
			assert.Assert(s.t, inOutput(u), "new hash missing in output")
		}
	}
}

func (s *sceneTestRunner) testDestroyScene() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	sceneID := createdScene.UUID()

	destroyed, err := s.client.destroyScene(models.SceneDestroyInput{
		ID: sceneID,
	})
	assert.NilError(s.t, err, "Error destroying scene")
	assert.Assert(s.t, destroyed, "Scene was not destroyed")

	// ensure cannot find scene
	foundScene, err := s.client.findScene(sceneID)
	assert.NilError(s.t, err, "Error finding scene after destroying")
	assert.Assert(s.t, foundScene == nil, "Found scene after destruction")

	// TODO - ensure scene was not removed
}

func (s *sceneTestRunner) testSubmitFingerprint() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	fp := s.generateSceneFingerprint(nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err, "Error finding scene")

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
	assert.DeepEqual(s.t, actual, expected)

	// submit the same fingerprint - should not add and should not error
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatch() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	unmatch := true
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      createdScene.Fingerprints[0].Hash,
			Algorithm: createdScene.Fingerprints[0].Algorithm,
			Duration:  createdScene.Fingerprints[0].Duration,
		},
		Unmatch: &unmatch,
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err)

	assert.Assert(s.t, len(scene.Fingerprints) == 0)
}

func (s *sceneTestRunner) testSubmitFingerprintModify() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	fp := s.generateSceneFingerprint(nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
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
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err)

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
	assert.DeepEqual(s.t, actual, expected)

	// submit the same fingerprint - should add
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	scene, err = s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err)

	expected.Submissions = 4
	actual.Submissions = scene.Fingerprints[0].Submissions

	assert.DeepEqual(s.t, actual, expected)
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatchModify() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	fp := s.generateSceneFingerprint(nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
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
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	unmatch := true
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
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
	})
	assert.NilError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NilError(s.t, err)

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
	assert.DeepEqual(s.t, actual, expected)
}

func (s *sceneTestRunner) verifyQueryScenesResult(filter models.SceneQueryInput, ids []uuid.UUID) {
	s.t.Helper()

	filter.Page = 1
	filter.PerPage = 10
	filter.Sort = models.SceneSortEnumTitle
	filter.Direction = models.SortDirectionEnumAsc

	results, err := s.client.queryScenes(filter)
	assert.NilError(s.t, err)

	assert.Equal(s.t, results.Count, len(ids))

	for _, id := range ids {
		found := false
		for _, scene := range results.Scenes {
			if scene.ID == id.String() {
				found = true
				break
			}
		}

		assert.Assert(s.t, found, "Missing scene")
	}
}

func (s *sceneTestRunner) verifyInvalidModifier(filter models.SceneQueryInput) {
	s.t.Helper()

	filter.Page = 1
	filter.PerPage = 10

	resolver, _ := s.resolver.Query().QueryScenes(s.ctx, filter)
	_, err := s.resolver.QueryScenesResultType().Scenes(s.ctx, resolver)
	assert.ErrorContains(s.t, err, "unsupported modifier")
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
		Date:     "2020-03-02",
	}

	scene1, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.StudioID = &studio2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.StudioID = nil
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	// test equals
	filter := models.SceneQueryInput{
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
		Performers: []models.PerformerAppearanceInput{
			{
				PerformerID: performer1ID,
			},
		},
		Title: &scene1Title,
		Date:  "2020-03-02",
	}

	scene1, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.Performers[0].PerformerID = performer2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.Performers = append(input.Performers, models.PerformerAppearanceInput{
		PerformerID: performer1ID,
	})
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	titleSearch := prefix
	filter := models.SceneQueryInput{
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
		Date:  "2020-03-02",
	}

	scene1, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.TagIds[0] = tag2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	input.TagIds = append(input.TagIds, tag1ID)
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	scene1ID := scene1.UUID()
	scene2ID := scene2.UUID()
	scene3ID := scene3.UUID()

	titleSearch := prefix
	filter := models.SceneQueryInput{
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
