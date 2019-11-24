// +build integration

package api_test

import (
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

type studioTestRunner struct {
	testRunner
	studioSuffix int
}

func createStudioTestRunner(t *testing.T) *studioTestRunner {
	return &studioTestRunner{
		testRunner: *createTestRunner(t),
	}
}

func (s *studioTestRunner) generateStudioName() string {
	s.studioSuffix += 1
	return "studioTestRunner-" + strconv.Itoa(s.studioSuffix)
}

func (s *studioTestRunner) testCreateStudio() {
	input := models.StudioCreateInput{
		Name: s.generateStudioName(),
	}

	studio, err := s.resolver.Mutation().StudioCreate(s.ctx, input)

	if err != nil {
		s.t.Errorf("Error creating studio: %s", err.Error())
		return
	}

	s.verifyCreatedStudio(input, studio)
}

func (s *studioTestRunner) verifyCreatedStudio(input models.StudioCreateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	if input.Name != studio.Name {
		s.fieldMismatch(input.Name, studio.Name, "Name")
	}

	r := s.resolver.Studio()

	id, _ := r.ID(s.ctx, studio)
	if id == "" {
		s.t.Errorf("Expected created studio id to be non-zero")
	}
}

func (s *studioTestRunner) testFindStudioById() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	studioID := strconv.FormatInt(createdStudio.ID, 10)
	studio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	if err != nil {
		s.t.Errorf("Error finding studio: %s", err.Error())
		return
	}

	// ensure returned studio is not nil
	if studio == nil {
		s.t.Error("Did not find studio by id")
		return
	}

	// ensure values were set
	if createdStudio.Name != studio.Name {
		s.fieldMismatch(createdStudio.Name, studio.Name, "Name")
	}
}

func (s *studioTestRunner) testFindStudioByName() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	studioName := createdStudio.Name
	studio, err := s.resolver.Query().FindStudio(s.ctx, nil, &studioName)
	if err != nil {
		s.t.Errorf("Error finding studio: %s", err.Error())
		return
	}

	// ensure returned studio is not nil
	if studio == nil {
		s.t.Error("Did not find studio by name")
		return
	}

	// ensure values were set
	if createdStudio.Name != studio.Name {
		s.fieldMismatch(createdStudio.Name, studio.Name, "Name")
	}
}

func (s *studioTestRunner) testUpdateStudioName() {
	input := &models.StudioCreateInput{
		Name: s.generateStudioName(),
	}

	createdStudio, err := s.createTestStudio(input)
	if err != nil {
		return
	}

	studioID := strconv.FormatInt(createdStudio.ID, 10)

	updatedName := s.generateStudioName()
	updateInput := models.StudioUpdateInput{
		ID:   studioID,
		Name: &updatedName,
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"name",
	})
	updatedStudio, err := s.resolver.Mutation().StudioUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating studio: %s", err.Error())
		return
	}

	input.Name = updatedName
	s.verifyCreatedStudio(*input, updatedStudio)
}

func (s *studioTestRunner) verifyUpdatedStudio(input models.StudioUpdateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	if input.Name != nil && *input.Name != studio.Name {
		s.fieldMismatch(input.Name, studio.Name, "Name")
	}
}

func (s *studioTestRunner) testDestroyStudio() {
	createdStudio, err := s.createTestStudio(nil)
	if err != nil {
		return
	}

	studioID := strconv.FormatInt(createdStudio.ID, 10)

	destroyed, err := s.resolver.Mutation().StudioDestroy(s.ctx, models.StudioDestroyInput{
		ID: studioID,
	})
	if err != nil {
		s.t.Errorf("Error destroying studio: %s", err.Error())
		return
	}

	if !destroyed {
		s.t.Error("Studio was not destroyed")
		return
	}

	// ensure cannot find studio
	foundStudio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	if err != nil {
		s.t.Errorf("Error finding studio after destroying: %s", err.Error())
		return
	}

	if foundStudio != nil {
		s.t.Error("Found studio after destruction")
	}

	// TODO - ensure scene was not removed
}

func TestCreateStudio(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testCreateStudio()
}

func TestFindStudioById(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testFindStudioById()
}

func TestFindStudioByName(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testFindStudioByName()
}

func TestUpdateStudioName(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testUpdateStudioName()
}

func TestDestroyStudio(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testDestroyStudio()
}

// TODO - test parent/children studios
