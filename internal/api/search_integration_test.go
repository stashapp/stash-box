//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/internal/models"
	"gotest.tools/v3/assert"
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
	assert.NilError(s.t, err)

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, createdPerformer.Name, nil)
	assert.NilError(s.t, err, "Error finding performer")

	// ensure returned performer is not nil
	assert.Assert(s.t, len(performers) > 0, "Did not find performer by name search")

	// ensure values were set
	assert.Equal(s.t, createdPerformer.UUID(), performers[0].ID)
}

func (s *searchTestRunner) testSearchPerformerByID() {
	createdPerformer, err := s.createTestPerformer(nil)
	assert.NilError(s.t, err)

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, "   "+createdPerformer.ID, nil)
	assert.NilError(s.t, err, "Error finding performer")

	// ensure returned performer is not nil
	assert.Assert(s.t, len(performers) > 0, "Did not find performer by name search")

	// ensure values were set
	assert.Equal(s.t, createdPerformer.UUID(), performers[0].ID)
}

func (s *searchTestRunner) testSearchSceneByTerm() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)
	studioID := createdStudio.UUID()

	title := "scene search title"
	date := "2019-02-03"
	input := models.SceneCreateInput{
		Title:    &title,
		Date:     date,
		StudioID: &studioID,
	}
	createdScene, err := s.createTestScene(&input)
	assert.NilError(s.t, err)

	scenes, err := s.resolver.Query().SearchScene(s.ctx, *createdScene.Title+" "+*createdScene.Date, nil)
	assert.NilError(s.t, err, "Error finding scene")

	assert.Assert(s.t, len(scenes) > 0, "Did not find scene by search")

	// ensure correct scene
	assert.Equal(s.t, createdScene.UUID(), scenes[0].ID)
}

func (s *searchTestRunner) testSearchSceneByID() {
	createdScene, err := s.createTestScene(nil)
	assert.NilError(s.t, err)

	scenes, err := s.resolver.Query().SearchScene(s.ctx, "   "+createdScene.ID, nil)
	assert.NilError(s.t, err, "Error finding scene")

	// ensure a scene is returned
	assert.Assert(s.t, len(scenes) > 0, "Did not find scene by id search")

	// ensure correct scene
	assert.Equal(s.t, createdScene.UUID(), scenes[0].ID)
}

func (s *searchTestRunner) testSearchTagByTerm() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tags, err := s.resolver.Query().SearchTag(s.ctx, createdTag.Name, nil)
	assert.NilError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.Assert(s.t, len(tags) > 0, "Did not find tag by name search")

	// ensure values were set
	assert.Equal(s.t, createdTag.UUID(), tags[0].ID)
}

func (s *searchTestRunner) testSearchTagByID() {
	createdTag, err := s.createTestTag(nil)
	assert.NilError(s.t, err)

	tags, err := s.resolver.Query().SearchTag(s.ctx, "   "+createdTag.ID, nil)
	assert.NilError(s.t, err, "Error finding tag")

	// ensure returned tag is not nil
	assert.Assert(s.t, len(tags) > 0, "Did not find tag by name search")

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
