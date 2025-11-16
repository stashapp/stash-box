//go:build integration

package api_test

import (
	"strconv"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
	assert.NoError(s.t, err, "Error creating studio")

	s.verifyCreatedStudio(input, studio)
}

func (s *studioTestRunner) verifyCreatedStudio(input models.StudioCreateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, studio.Name)

	assert.True(s.t, studio.ID != uuid.Nil, "Expected created studio id to be non-zero")
}

func (s *studioTestRunner) testFindStudioById() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)

	studioID := createdStudio.UUID()
	studio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	assert.NoError(s.t, err, "Error finding studio")

	// ensure returned studio is not nil
	assert.NotNil(s.t, studio, "Did not find studio by id")

	// ensure values were set
	assert.Equal(s.t, createdStudio.Name, studio.Name)
}

func (s *studioTestRunner) testFindStudioByName() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)

	studioName := createdStudio.Name
	studio, err := s.resolver.Query().FindStudio(s.ctx, nil, &studioName)
	assert.NoError(s.t, err, "Error finding studio")

	// ensure returned studio is not nil
	assert.NotNil(s.t, studio, "Did not find studio by name")

	// ensure values were set
	assert.Equal(s.t, createdStudio.Name, studio.Name)
}

func (s *studioTestRunner) testUpdateStudioName() {
	input := &models.StudioCreateInput{
		Name: s.generateStudioName(),
	}

	createdStudio, err := s.createTestStudio(input)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err, "Error updating studio")

	input.Name = updatedName
	s.verifyCreatedStudio(*input, updatedStudio)
}

func (s *studioTestRunner) verifyUpdatedStudio(input models.StudioUpdateInput, studio *models.Studio) {
	// ensure basic attributes are set correctly
	assert.True(s.t, input.Name == nil || (*input.Name == studio.Name))
}

func (s *studioTestRunner) testDestroyStudio() {
	createdStudio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)

	studioID := createdStudio.UUID()

	destroyed, err := s.resolver.Mutation().StudioDestroy(s.ctx, models.StudioDestroyInput{
		ID: studioID,
	})
	assert.NoError(s.t, err, "Error destroying studio")

	assert.True(s.t, destroyed, "Studio was not destroyed")

	// ensure cannot find studio
	foundStudio, err := s.resolver.Query().FindStudio(s.ctx, &studioID, nil)
	assert.NoError(s.t, err, "Error finding studio after destroying")

	assert.True(s.t, foundStudio == nil, nil, "Found studio after destruction")

	// TODO - ensure scene was not removed
}

func (s *studioTestRunner) testQueryStudios() {
	// Create test studios
	name1 := s.generateStudioName()
	studio1, err := s.createTestStudio(&models.StudioCreateInput{
		Name: name1,
	})
	assert.NoError(s.t, err)

	name2 := s.generateStudioName()
	studio2, err := s.createTestStudio(&models.StudioCreateInput{
		Name: name2,
	})
	assert.NoError(s.t, err)

	// Test basic query
	result, err := s.client.queryStudios(models.StudioQueryInput{
		Page:      1,
		PerPage:   100,
		Direction: models.SortDirectionEnumAsc,
		Sort:      models.StudioSortEnumName,
	})
	assert.NoError(s.t, err, "Error querying studios")

	// Ensure we have at least the studios we created
	assert.True(s.t, result.Count >= 2, "Expected at least 2 studios in count")
	assert.True(s.t, len(result.Studios) >= 2, "Expected at least 2 studios in results")

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

	assert.True(s.t, found1, "Created studio 1 not found in query results")
	assert.True(s.t, found2, "Created studio 2 not found in query results")
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

func (s *studioTestRunner) testParentChildStudios() {
	// Create parent studio
	parentInput := models.StudioCreateInput{
		Name: s.generateStudioName(),
	}
	parentStudio, err := s.resolver.Mutation().StudioCreate(s.ctx, parentInput)
	assert.NoError(s.t, err, "Error creating parent studio")

	parentID := parentStudio.ID

	// Create child studios
	child1Input := models.StudioCreateInput{
		Name:     s.generateStudioName(),
		ParentID: &parentID,
	}
	child1, err := s.resolver.Mutation().StudioCreate(s.ctx, child1Input)
	assert.NoError(s.t, err, "Error creating child studio 1")

	child2Input := models.StudioCreateInput{
		Name:     s.generateStudioName(),
		ParentID: &parentID,
	}
	child2, err := s.resolver.Mutation().StudioCreate(s.ctx, child2Input)
	assert.NoError(s.t, err, "Error creating child studio 2")

	child3Input := models.StudioCreateInput{
		Name:     s.generateStudioName(),
		ParentID: &parentID,
	}
	child3, err := s.resolver.Mutation().StudioCreate(s.ctx, child3Input)
	assert.NoError(s.t, err, "Error creating child studio 3")

	// Query parent studio using GraphQL client to get child_studios field
	queriedParent, err := s.client.findStudio(parentID)
	assert.NoError(s.t, err, "Error finding parent studio")
	assert.NotNil(s.t, queriedParent, "Parent studio not found")

	// Verify child_studios field contains the created children
	assert.Equal(s.t, 3, len(queriedParent.ChildStudios), "Expected 3 child studios")

	// Verify all child IDs are present
	childIDs := make(map[string]bool)
	for _, child := range queriedParent.ChildStudios {
		childIDs[child.ID] = true
	}

	assert.True(s.t, childIDs[child1.ID.String()], "Child1 not found in parent's child_studios")
	assert.True(s.t, childIDs[child2.ID.String()], "Child2 not found in parent's child_studios")
	assert.True(s.t, childIDs[child3.ID.String()], "Child3 not found in parent's child_studios")

	// Verify each child has correct parent
	for _, childID := range []uuid.UUID{child1.ID, child2.ID, child3.ID} {
		child, err := s.resolver.Query().FindStudio(s.ctx, &childID, nil)
		assert.NoError(s.t, err, "Error finding child studio")
		assert.NotNil(s.t, child, "Child studio not found")

		parent, err := s.resolver.Studio().Parent(s.ctx, child)
		assert.NoError(s.t, err, "Error getting parent from child")
		assert.NotNil(s.t, parent, "Parent not found from child")
		assert.Equal(s.t, parentID, parent.ID, "Child's parent ID doesn't match")
	}
}

func TestParentChildStudios(t *testing.T) {
	pt := createStudioTestRunner(t)
	pt.testParentChildStudios()
}
