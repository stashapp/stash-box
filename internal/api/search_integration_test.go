//go:build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type searchTestRunner struct {
	testRunner
}

func createSearchTestRunner(t *testing.T) *searchTestRunner {
	return &searchTestRunner{
		testRunner: *asModify(t),
	}
}

func (s *searchTestRunner) testSearchPerformerByTerm() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, createdPerformer.Name, nil)
	assert.NoError(s.t, err, "Error finding performer")

	// ensure returned performer is not nil
	assert.True(s.t, len(performers) > 0, "Did not find performer by name search")

	// ensure values were set
	assert.Equal(s.t, createdPerformer.UUID(), performers[0].ID)
}

func (s *searchTestRunner) testSearchPerformerByID() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, "   "+createdPerformer.ID, nil)
	assert.NoError(s.t, err, "Error finding performer")

	// ensure returned performer is not nil
	assert.True(s.t, len(performers) > 0, "Did not find performer by name search")

	// ensure values were set
	assert.Equal(s.t, createdPerformer.UUID(), performers[0].ID)
}

func (s *searchTestRunner) testSearchPerformerByNonExistentID() {
	// Search for a non-existent performer ID should return empty result, not error
	nonExistentID := "00000000-0000-0000-0000-000000000000"
	performers, err := s.resolver.Query().SearchPerformer(s.ctx, nonExistentID, nil)
	assert.NoError(s.t, err, "Should not error when performer not found")
	assert.Equal(s.t, 0, len(performers), "Should return empty result for non-existent ID")
}

func (s *searchTestRunner) testSearchSceneByTerm() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)
	studioID := createdStudio.UUID()

	title := "scene search title"
	date := "2019-02-03"
	input := models.SceneCreateInput{
		Title:    &title,
		Date:     date,
		StudioID: &studioID,
	}
	createdScene, err := s.createTestScene(&input)
	assert.NoError(s.t, err)

	scenes, err := s.resolver.Query().SearchScene(s.ctx, *createdScene.Title+" "+*createdScene.Date, nil)
	assert.NoError(s.t, err, "Error finding scene")

	assert.True(s.t, len(scenes) > 0, "Did not find scene by search")

	// ensure correct scene
	assert.Equal(s.t, createdScene.UUID(), scenes[0].ID)
}

func (s *searchTestRunner) testSearchSceneByID() {
	createdScene, err := s.createTestScene(nil)
	assert.NoError(s.t, err)

	scenes, err := s.resolver.Query().SearchScene(s.ctx, "   "+createdScene.ID, nil)
	assert.NoError(s.t, err, "Error finding scene")

	// ensure a scene is returned
	assert.True(s.t, len(scenes) > 0, "Did not find scene by id search")

	// ensure correct scene
	assert.Equal(s.t, createdScene.UUID(), scenes[0].ID)
}

func (s *searchTestRunner) testSearchTagByTerm() {
	createdTag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	tags, err := s.resolver.Query().SearchTag(s.ctx, createdTag.Name, nil)
	assert.NoError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.True(s.t, len(tags) > 0, "Did not find tag by name search")

	// ensure values were set
	assert.Equal(s.t, createdTag.UUID(), tags[0].ID)
}

func (s *searchTestRunner) testSearchTagByID() {
	createdTag, err := s.createTestTag(nil)
	assert.NoError(s.t, err)

	tags, err := s.resolver.Query().SearchTag(s.ctx, "   "+createdTag.ID, nil)
	assert.NoError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.True(s.t, len(tags) > 0, "Did not find tag by name search")

	// ensure values were set
	assert.Equal(s.t, createdTag.UUID(), tags[0].ID)
}

func TestSearchPerformerByTerm(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchPerformerByTerm()
}

func TestSearchPerformerByID(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchPerformerByID()
}

func TestSearchPerformerByNonExistentID(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchPerformerByNonExistentID()
}

func TestSearchSceneByTerm(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchSceneByTerm()
}

func TestSearchSceneByID(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchSceneByID()
}

func TestSearchTagByTerm(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchTagByTerm()
}

func TestSearchTagByID(t *testing.T) {
	pt := createSearchTestRunner(t)
	pt.testSearchTagByID()
}
