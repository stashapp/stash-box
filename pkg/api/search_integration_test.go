//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
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
	if err != nil {
		return
	}

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, createdPerformer.Name, nil)
	if err != nil {
		s.t.Errorf("Error finding performer: %s", err.Error())
		return
	}

	// ensure returned performer is not nil
	if len(performers) == 0 {
		s.t.Error("Did not find performer by name search")
		return
	}

	// ensure values were set
	if createdPerformer.UUID() != performers[0].ID {
		s.fieldMismatch(createdPerformer.ID, performers[0].ID, "ID")
	}
}

func (s *searchTestRunner) testSearchPerformerByID() {
	createdPerformer, err := s.createTestPerformer(nil)
	if err != nil {
		return
	}

	performers, err := s.resolver.Query().SearchPerformer(s.ctx, "   "+createdPerformer.ID, nil)
	if err != nil {
		s.t.Errorf("Error finding performer: %s", err.Error())
		return
	}

	// ensure returned performer is not nil
	if len(performers) == 0 {
		s.t.Error("Did not find performer by name search")
		return
	}

	// ensure values were set
	if createdPerformer.UUID() != performers[0].ID {
		s.fieldMismatch(createdPerformer.ID, performers[0].ID, "ID")
	}
}

func (s *searchTestRunner) testSearchSceneByTerm() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}
	studioID := createdStudio.UUID()

	title := "scene search title"
	date := "2019-02-03"
	input := models.SceneCreateInput{
		Title:    &title,
		Date:     &date,
		StudioID: &studioID,
	}
	createdScene, err := s.createTestScene(&input)
	if err != nil {
		return
	}

	scenes, err := s.resolver.Query().SearchScene(s.ctx, *createdScene.Title+" "+*createdScene.Date, nil)
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// ensure a scene is returned
	if len(scenes) == 0 {
		s.t.Error("Did not find scene by search")
		return
	}

	// ensure correct scene
	if createdScene.UUID() != scenes[0].ID {
		s.fieldMismatch(createdScene.ID, scenes[0].ID, "ID")
	}
}

func (s *searchTestRunner) testSearchSceneByID() {
	createdScene, err := s.createTestScene(nil)
	if err != nil {
		return
	}

	scenes, err := s.resolver.Query().SearchScene(s.ctx, "   "+createdScene.ID, nil)
	if err != nil {
		s.t.Errorf("Error finding scene: %s", err.Error())
		return
	}

	// ensure a scene is returned
	if len(scenes) == 0 {
		s.t.Error("Did not find scene by id search")
		return
	}

	// ensure correct scene
	if createdScene.UUID() != scenes[0].ID {
		s.fieldMismatch(createdScene.ID, scenes[0].ID, "ID")
	}
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
