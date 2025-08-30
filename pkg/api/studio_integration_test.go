//go:build integration
// +build integration

package api_test

import (
	"strconv"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gotest.tools/v3/assert"
)

type studioTestRunner struct {
	testRunner
	studioSuffix int
}

func createStudioTestRunner(t *testing.T) *studioTestRunner {
	return &studioTestRunner{
		testRunner: *asModify(t),
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
	assert.NilError(s.t, err, "Error creating studio")

	s.verifyCreatedStudio(input, studio)
}

func (s *studioTestRunner) verifyCreatedStudio(input models.StudioCreateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, studio.Name)

	assert.Assert(s.t, studio.ID != uuid.Nil, "Expected created studio id to be non-zero")
}

func (s *studioTestRunner) testFindStudioById() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	studioID := createdStudio.UUID()
	studio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	assert.NilError(s.t, err, "Error finding studio")

	// ensure returned studio is not nil
	assert.Assert(s.t, studio != nil, "Did not find studio by id")

	// ensure values were set
	assert.Equal(s.t, createdStudio.Name, studio.Name)
}

func (s *studioTestRunner) testFindStudioByName() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	studioName := createdStudio.Name
	studio, err := s.resolver.Query().FindStudio(s.ctx, nil, &studioName)
	assert.NilError(s.t, err, "Error finding studio")

	// ensure returned studio is not nil
	assert.Assert(s.t, studio != nil, "Did not find studio by name")

	// ensure values were set
	assert.Equal(s.t, createdStudio.Name, studio.Name)
}

func (s *studioTestRunner) testUpdateStudioName() {
	input := &models.StudioCreateInput{
		Name: s.generateStudioName(),
	}

	createdStudio, err := s.createTestStudio(input)
	assert.NilError(s.t, err)

	studioID := createdStudio.UUID()

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
	assert.NilError(s.t, err, "Error updating studio")

	input.Name = updatedName
	s.verifyCreatedStudio(*input, updatedStudio)
}

func (s *studioTestRunner) verifyUpdatedStudio(input models.StudioUpdateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, input.Name == nil || (*input.Name == studio.Name))
}

func (s *studioTestRunner) testDestroyStudio() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NilError(s.t, err)

	studioID := createdStudio.UUID()

	destroyed, err := s.resolver.Mutation().StudioDestroy(s.ctx, models.StudioDestroyInput{
		ID: studioID,
	})
	assert.NilError(s.t, err, "Error destroying studio")

	assert.Assert(s.t, destroyed, "Studio was not destroyed")

	// ensure cannot find studio
	foundStudio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	assert.NilError(s.t, err, "Error finding studio after destroying")

	assert.Assert(s.t, foundStudio == nil, nil, "Found studio after destruction")

	// TODO - ensure scene was not removed
}

func (s *studioTestRunner) testQueryStudios() {
	// Create test studios
	name1 := s.generateStudioName()
	studio1, err := s.createTestStudio(&models.StudioCreateInput{
		Name: name1,
	})
	assert.NilError(s.t, err)

	name2 := s.generateStudioName()
	studio2, err := s.createTestStudio(&models.StudioCreateInput{
		Name: name2,
	})
	assert.NilError(s.t, err)

	// Test basic query
	result, err := s.client.queryStudios(models.StudioQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.StudioSortEnumName,
	})
	assert.NilError(s.t, err, "Error querying studios")

	// Ensure we have at least the studios we created
	assert.Assert(s.t, result.Count >= 2, "Expected at least 2 studios in count")
	assert.Assert(s.t, len(result.Studios) >= 2, "Expected at least 2 studios in results")

	// Debug: check studio IDs
	s.t.Logf("Looking for studio1 ID: %s, studio2 ID: %s", studio1.ID, studio2.ID)
	s.t.Logf("Query returned %d studios", len(result.Studios))

	// Verify our created studios are in the results
	found1 := false
	found2 := false
	for _, st := range result.Studios {
		if st.ID == studio1.ID {
			found1 = true
			assert.Equal(s.t, name1, st.Name)
		}
		if st.ID == studio2.ID {
			found2 = true
			assert.Equal(s.t, name2, st.Name)
		}
	}

	assert.Assert(s.t, found1, "Created studio 1 not found in query results")
	assert.Assert(s.t, found2, "Created studio 2 not found in query results")
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

func TestQueryStudios(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testQueryStudios()
}

// TODO - test parent/children studios
