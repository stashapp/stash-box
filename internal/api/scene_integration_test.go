//go:build integration

package api_test

import (
	"fmt"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
	assert.NoError(s.t, err)

	s.verifyCreatedScene(input, scene)
}

func (s *sceneTestRunner) verifyCreatedScene(input models.SceneCreateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	assert.True(s.t, scene.ID != "", "Expected created scene id to be non-zero")

	assert.Equal(s.t, scene.Title, input.Title)
	assert.Equal(s.t, scene.Details, input.Details)

	s.compareSiteURLs(input.Urls, scene.Urls)

	assert.True(s.t, bothNil(scene.Date, input.Date) || (!oneNil(scene.Date, input.Date) && input.Date == *scene.Date))
	assert.True(s.t, bothNil(scene.ProductionDate, input.ProductionDate) || (!oneNil(scene.ProductionDate, input.ProductionDate) && *input.ProductionDate == *scene.ProductionDate))
	assert.True(s.t, compareFingerprints(input.Fingerprints, scene.Fingerprints))
	assert.True(s.t, comparePerformers(input.Performers, scene.Performers))
	assert.True(s.t, compareTags(input.TagIds, scene.Tags))
}

func (s *sceneTestRunner) testFindSceneById() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err)

	// ensure returned scene is not nil
	assert.NotNil(s.t, scene, "Did not find scene by id")

	// ensure values were set
	assert.Equal(s.t, *createdScene.Title, *scene.Title)
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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	s.verifyUpdatedScene(updateInput, scene)

	// ensure fingerprint changes were enacted
	s.verifyUpdatedFingerprints(input.Fingerprints, updateInput.Fingerprints, scene)

	// ensure submissions count was maintained
	originalFP := input.Fingerprints[0]
	foundFP := false
	for _, f := range scene.Fingerprints {
		if originalFP.Algorithm == f.Algorithm && originalFP.Hash.Hex() == f.Hash {
			foundFP = true
			assert.Equal(s.t, f.Submissions, 2, "Incorrect fingerprint submissions count")
		}
	}

	assert.True(s.t, foundFP, "Could not find original fingerprint")
}

func (s *sceneTestRunner) verifyUpdatedScene(input models.SceneUpdateInput, scene *sceneOutput) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, scene.Title, input.Title)
	assert.Equal(s.t, scene.Details, input.Details)

	assert.True(s.t, bothNil(scene.Date, input.Date) || (!oneNil(scene.Date, input.Date) && *scene.Date == *input.Date))
	assert.True(s.t, bothNil(scene.ProductionDate, input.ProductionDate) || (!oneNil(scene.ProductionDate, input.ProductionDate) && *scene.ProductionDate == *input.ProductionDate))

	s.compareSiteURLs(input.Urls, scene.Urls)

	assert.True(s.t, comparePerformers(input.Performers, scene.Performers))
	assert.True(s.t, compareTags(input.TagIds, scene.Tags))
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
			if hh.Algorithm == h.Algorithm && hh.Hash == h.Hash.Hex() {
				return true
			}
		}

		return false
	}

	for _, o := range original {
		// find in updated
		if hashExists(o, updated) {
			// exists, so ensure hash exists in output
			assert.True(s.t, inOutput(o), "existing hash s missing in output")
		} else {
			// not exists, ensure not in output
			assert.True(s.t, !inOutput(o), "removed hash %s still in output")
		}
	}

	for _, u := range updated {
		// find in original
		if !hashExists(u, original) {
			// new hash, ensure in output
			assert.True(s.t, inOutput(u), "new hash missing in output")
		}
	}
}

func (s *sceneTestRunner) testDestroyScene() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	sceneID := createdScene.UUID()

	destroyed, err := s.client.destroyScene(models.SceneDestroyInput{
		ID: sceneID,
	})
	assert.NoError(s.t, err, "Error destroying scene")
	assert.True(s.t, destroyed, "Scene was not destroyed")

	// ensure cannot find scene
	foundScene, err := s.client.findScene(sceneID)
	assert.NoError(s.t, err, "Error finding scene after destroying")
	assert.Nil(s.t, foundScene, "Found scene after destruction")

	// TODO - ensure scene was not removed
}

func (s *sceneTestRunner) testSubmitFingerprint() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	fp := s.generateSceneFingerprint(nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NoError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err, "Error finding scene")

	// verify created fingerprint
	expected := fingerprint{
		Hash:        fp.Hash.Hex(),
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
	assert.Equal(s.t, actual, expected)

	// submit the same fingerprint - should not add and should not error
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NoError(s.t, err, "Error submitting fingerprint")
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatch() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	unmatch := true
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      createdScene.Fingerprints[0].FingerprintHash(),
			Algorithm: createdScene.Fingerprints[0].Algorithm,
			Duration:  createdScene.Fingerprints[0].Duration,
		},
		Unmatch: &unmatch,
	})
	assert.NoError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err)

	assert.True(s.t, len(scene.Fingerprints) == 0)
}

func (s *sceneTestRunner) testSubmitFingerprintModify() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err)

	// verify created fingerprint
	expected := fingerprint{
		Hash:        fp.Hash.Hex(),
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
	assert.Equal(s.t, actual, expected)

	// submit the same fingerprint - should add
	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: createdScene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  fp.Duration,
		},
	})
	assert.NoError(s.t, err, "Error submitting fingerprint")

	scene, err = s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err)

	expected.Submissions = 4
	actual.Submissions = scene.Fingerprints[0].Submissions

	assert.Equal(s.t, actual, expected)
}

func (s *sceneTestRunner) testSubmitFingerprintUnmatchModify() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err, "Error submitting fingerprint")

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
	assert.NoError(s.t, err, "Error submitting fingerprint")

	scene, err := s.client.findScene(createdScene.UUID())
	assert.NoError(s.t, err)

	expected := fingerprint{
		Hash:        fp.Hash.Hex(),
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
	assert.Equal(s.t, actual, expected)
}

func (s *sceneTestRunner) verifyQueryScenesResult(filter models.SceneQueryInput, ids []uuid.UUID) {
	s.t.Helper()

	filter.Page = 1
	filter.PerPage = 10
	filter.Sort = models.SceneSortEnumTitle
	filter.Direction = models.SortDirectionEnumAsc

	results, err := s.client.queryScenes(filter)
	assert.NoError(s.t, err)

	assert.Equal(s.t, results.Count, len(ids))

	for _, id := range ids {
		found := false
		for _, scene := range results.Scenes {
			if scene.ID == id.String() {
				found = true
				break
			}
		}

		assert.True(s.t, found, "Missing scene")
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
	assert.NoError(s.t, err)

	input.StudioID = &studio2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

	input.StudioID = nil
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	input.Performers[0].PerformerID = performer2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

	input.Performers = append(input.Performers, models.PerformerAppearanceInput{
		PerformerID: performer1ID,
	})
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

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

	// test INCLUDES with multiple performers - scene3 has both performers and should appear only once
	filter.Performers.Modifier = models.CriterionModifierIncludes
	filter.Performers.Value = []uuid.UUID{performer1ID, performer2ID}
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID, scene2ID, scene3ID})

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
	assert.NoError(s.t, err)

	input.TagIds[0] = tag2ID
	input.Title = &scene2Title
	scene2, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

	input.TagIds = append(input.TagIds, tag1ID)
	input.Title = &scene3Title
	scene3, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

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

	// test INCLUDES with multiple tags - scene3 has both tags and should appear only once
	filter.Tags.Modifier = models.CriterionModifierIncludes
	filter.Tags.Value = []uuid.UUID{tag1ID, tag2ID}
	s.verifyQueryScenesResult(filter, []uuid.UUID{scene1ID, scene2ID, scene3ID})

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

func (s *sceneTestRunner) testFindScenesBySceneFingerprints() {
	// Enable phash distance matching for this test
	originalPHashDistance := config.GetPHashDistance()
	config.C.PHashDistance = 2
	defer func() {
		config.C.PHashDistance = originalPHashDistance
	}()

	// Create a scene with multiple fingerprints (MD5, OSHASH, and PHASH)
	title := "Scene with Multiple Fingerprints for Scene Fingerprints Query"
	md5Fingerprint := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmMd5, nil)
	oshashFingerprint := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmOshash, nil)
	phashFingerprint := models.FingerprintEditInput{
		Algorithm: models.FingerprintAlgorithmPhash,
		Hash:      models.FingerprintHash(0x2), // Different from the other test
		Duration:  1234,
		UserIds:   []uuid.UUID{},
	}

	input := models.SceneCreateInput{
		Title: &title,
		Date:  "2020-03-02",
		Fingerprints: []models.FingerprintEditInput{
			md5Fingerprint,
			oshashFingerprint,
			phashFingerprint,
		},
	}

	createdScene, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

	// Query with all three fingerprints as a single scene's fingerprints
	// This should return the scene ONCE, not three times
	queryFingerprints := [][]models.FingerprintQueryInput{
		{
			{
				Algorithm: md5Fingerprint.Algorithm,
				Hash:      md5Fingerprint.Hash,
			},
			{
				Algorithm: oshashFingerprint.Algorithm,
				Hash:      oshashFingerprint.Hash,
			},
			{
				Algorithm: phashFingerprint.Algorithm,
				Hash:      phashFingerprint.Hash,
			},
		},
	}

	results, err := s.client.findScenesBySceneFingerprints(queryFingerprints)
	assert.NoError(s.t, err)

	// Should return one array (one for each input set of fingerprints)
	assert.Equal(s.t, len(results), 1, "Should return one result set")

	// Within that array, the scene should only appear ONCE, not three times
	assert.Equal(s.t, len(results[0]), 1, "Scene should only be returned once, not duplicated for each fingerprint")
	assert.Equal(s.t, results[0][0].ID, createdScene.ID, "Returned scene should match the created scene")
}

func TestFindScenesBySceneFingerprints(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindScenesBySceneFingerprints()
}

func (s *sceneTestRunner) testMoveFingerprintSubmissions() {
	// Create two scenes with fingerprints
	scene1, err := s.createTestScene(nil)
	assert.Nil(s.t, err)
	scene2, err := s.createTestScene(nil)
	assert.Nil(s.t, err)

	// Add additional fingerprints to scene1 via submission
	fp1 := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmOshash, nil)
	fp2 := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmMd5, nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: scene1.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp1.Hash,
			Algorithm: fp1.Algorithm,
			Duration:  fp1.Duration,
		},
	})
	assert.Nil(s.t, err)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: scene1.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp2.Hash,
			Algorithm: fp2.Algorithm,
			Duration:  fp2.Duration,
		},
	})
	assert.Nil(s.t, err)

	// Verify scene1 has the fingerprints
	updatedScene1, err := s.client.findScene(scene1.UUID())
	assert.Nil(s.t, err)
	assert.True(s.t, len(updatedScene1.Fingerprints) >= 2)

	// Move the fingerprints from scene1 to scene2
	moderateUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumModerate})
	assert.Nil(s.t, err)

	moderateRunner := createTestRunner(s.t, moderateUser, []models.RoleEnum{models.RoleEnumModerate})

	_, err = moderateRunner.client.sceneMoveFingerprintSubmissions(models.MoveFingerprintSubmissionsInput{
		Fingerprints: []models.FingerprintQueryInput{
			{Hash: fp1.Hash, Algorithm: fp1.Algorithm},
			{Hash: fp2.Hash, Algorithm: fp2.Algorithm},
		},
		SourceSceneID: scene1.UUID(),
		TargetSceneID: scene2.UUID(),
	})
	fmt.Println(err)
	assert.Nil(s.t, err)

	// Verify scene1 no longer has these fingerprints
	updatedScene1, err = s.client.findScene(scene1.UUID())
	assert.Nil(s.t, err)
	for _, fp := range updatedScene1.Fingerprints {
		assert.NotEqual(s.t, fp1.Hash, fp.Hash)
		assert.NotEqual(s.t, fp2.Hash, fp.Hash)
	}

	// Verify scene2 now has the fingerprints
	updatedScene2, err := s.client.findScene(scene2.UUID())
	assert.Nil(s.t, err)
	foundFP1 := false
	foundFP2 := false
	for _, fp := range updatedScene2.Fingerprints {
		if fp.Hash == fp1.Hash && fp.Algorithm == fp1.Algorithm {
			foundFP1 = true
		}
		if fp.Hash == fp2.Hash && fp.Algorithm == fp2.Algorithm {
			foundFP2 = true
		}
	}
	assert.True(s.t, foundFP1, "Fingerprint 1 should be moved to scene2")
	assert.True(s.t, foundFP2, "Fingerprint 2 should be moved to scene2")
}

func (s *sceneTestRunner) testDeleteFingerprintSubmissions() {
	// Create a scene with fingerprints
	scene, err := s.createTestScene(nil)
	assert.Nil(s.t, err)

	// Add additional fingerprints via submission
	fp1 := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmOshash, nil)
	fp2 := s.generateSceneFingerprintWithAlgorithm(models.FingerprintAlgorithmMd5, nil)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: scene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp1.Hash,
			Algorithm: fp1.Algorithm,
			Duration:  fp1.Duration,
		},
	})
	assert.Nil(s.t, err)

	_, err = s.client.submitFingerprint(models.FingerprintSubmission{
		SceneID: scene.UUID(),
		Fingerprint: &models.FingerprintInput{
			Hash:      fp2.Hash,
			Algorithm: fp2.Algorithm,
			Duration:  fp2.Duration,
		},
	})
	assert.Nil(s.t, err)

	// Verify scene has the fingerprints
	updatedScene, err := s.client.findScene(scene.UUID())
	assert.Nil(s.t, err)
	initialCount := len(updatedScene.Fingerprints)
	assert.True(s.t, initialCount >= 2)

	// Delete the fingerprints
	moderateUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumModerate})
	assert.Nil(s.t, err)

	moderateRunner := createTestRunner(s.t, moderateUser, []models.RoleEnum{models.RoleEnumModerate})

	_, err = moderateRunner.client.sceneDeleteFingerprintSubmissions(models.DeleteFingerprintSubmissionsInput{
		Fingerprints: []models.FingerprintQueryInput{
			{Hash: fp1.Hash, Algorithm: fp1.Algorithm},
			{Hash: fp2.Hash, Algorithm: fp2.Algorithm},
		},
		SceneID: scene.UUID(),
	})
	assert.Nil(s.t, err)

	// Verify scene no longer has these fingerprints
	updatedScene, err = s.client.findScene(scene.UUID())
	assert.Nil(s.t, err)
	for _, fp := range updatedScene.Fingerprints {
		assert.NotEqual(s.t, fp1.Hash, fp.Hash, "Fingerprint 1 should be deleted")
		assert.NotEqual(s.t, fp2.Hash, fp.Hash, "Fingerprint 2 should be deleted")
	}
	assert.Equal(s.t, initialCount-2, len(updatedScene.Fingerprints), "Should have 2 fewer fingerprints")
}

func TestMoveFingerprintSubmissions(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testMoveFingerprintSubmissions()
}

func TestDeleteFingerprintSubmissions(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testDeleteFingerprintSubmissions()
}

func (s *sceneTestRunner) testFindScenesBySceneFingerprintsMultipleMatches() {
	// Create multiple scenes with the same OSHASH to test that all are returned
	// Using OSHASH instead of phash to avoid distance matching complexity
	sharedHash := models.FingerprintHash(0x1234567890abcdef)

	title1 := "Scene 1 with Shared Hash"
	oshashFingerprint1 := models.FingerprintEditInput{
		Algorithm: models.FingerprintAlgorithmOshash,
		Hash:      sharedHash,
		Duration:  1234,
		UserIds:   []uuid.UUID{},
	}
	input1 := models.SceneCreateInput{
		Title: &title1,
		Date:  "2020-03-02",
		Fingerprints: []models.FingerprintEditInput{
			oshashFingerprint1,
		},
	}
	createdScene1, err := s.createTestScene(&input1)
	assert.NoError(s.t, err)

	title2 := "Scene 2 with Shared Hash"
	oshashFingerprint2 := models.FingerprintEditInput{
		Algorithm: models.FingerprintAlgorithmOshash,
		Hash:      sharedHash,
		Duration:  1235,
		UserIds:   []uuid.UUID{},
	}
	input2 := models.SceneCreateInput{
		Title: &title2,
		Date:  "2020-03-03",
		Fingerprints: []models.FingerprintEditInput{
			oshashFingerprint2,
		},
	}
	createdScene2, err := s.createTestScene(&input2)
	assert.NoError(s.t, err)

	title3 := "Scene 3 with Shared Hash"
	oshashFingerprint3 := models.FingerprintEditInput{
		Algorithm: models.FingerprintAlgorithmOshash,
		Hash:      sharedHash,
		Duration:  1236,
		UserIds:   []uuid.UUID{},
	}
	input3 := models.SceneCreateInput{
		Title: &title3,
		Date:  "2020-03-04",
		Fingerprints: []models.FingerprintEditInput{
			oshashFingerprint3,
		},
	}
	createdScene3, err := s.createTestScene(&input3)
	assert.NoError(s.t, err)

	// Query with the shared hash - should return ALL three scenes
	queryFingerprints := [][]models.FingerprintQueryInput{
		{
			{
				Algorithm: models.FingerprintAlgorithmOshash,
				Hash:      sharedHash,
			},
		},
	}

	results, err := s.client.findScenesBySceneFingerprints(queryFingerprints)
	assert.NoError(s.t, err)

	// Should return one array (one for each input set of fingerprints)
	assert.Equal(s.t, 1, len(results), "Should return one result set")

	// Within that array, all three scenes should be returned
	assert.Equal(s.t, 3, len(results[0]), "All three scenes with the same hash should be returned")

	// Verify all three scene IDs are present
	returnedIDs := make(map[string]bool)
	for _, scene := range results[0] {
		returnedIDs[scene.ID] = true
	}

	assert.True(s.t, returnedIDs[createdScene1.ID], "Scene 1 should be in results")
	assert.True(s.t, returnedIDs[createdScene2.ID], "Scene 2 should be in results")
	assert.True(s.t, returnedIDs[createdScene3.ID], "Scene 3 should be in results")
}

func TestFindScenesBySceneFingerprintsMultipleMatches(t *testing.T) {
	pt := createSceneTestRunner(t)
	pt.testFindScenesBySceneFingerprintsMultipleMatches()
}
