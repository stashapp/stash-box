//go:build integration
// +build integration

package api_test

import (
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"gotest.tools/v3/assert"
)

type tagCategoryTestRunner struct {
	testRunner
}

func createTagCategoryTestRunner(t *testing.T) *tagCategoryTestRunner {
	return &tagCategoryTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *tagCategoryTestRunner) testCreateTagCategory() {
	description := "Description"

	input := models.TagCategoryCreateInput{
		Name:        s.generateCategoryName(),
		Description: &description,
		Group:       models.TagGroupEnumPeople,
	}

	category, err := s.resolver.Mutation().TagCategoryCreate(s.ctx, input)
	assert.NilError(s.t, err, "Error creating tagCategory")

	s.verifyCreatedTagCategory(input, category)
}

func (s *tagCategoryTestRunner) verifyCreatedTagCategory(input models.TagCategoryCreateInput, category *models.TagCategory) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, category.Name)

	r := s.resolver.TagCategory()

	assert.Assert(s.t, category.ID != uuid.Nil, "Expected created tagCategory id to be non-zero")

	description, _ := r.Description(s.ctx, category)
	assert.DeepEqual(s.t, description, input.Description)

	group, _ := r.Group(s.ctx, category)
	assert.DeepEqual(s.t, group, models.TagGroupEnumPeople)
}

func (s *tagCategoryTestRunner) testFindTagCategoryById() {
	createdCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	category, err := s.resolver.Query().FindTagCategory(s.ctx, createdCategory.ID)
	assert.NilError(s.t, err, "Error finding tagCategory")

	// ensure returned tagCategory is not nil
	assert.Assert(s.t, category != nil, "Did not find tagCategory by id")

	// ensure values were set
	assert.Equal(s.t, createdCategory.Name, category.Name)
}

func (s *tagCategoryTestRunner) testUpdateTagCategory() {
	createdCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	catID := createdCategory.ID

	newDescription := "newDescription"

	updateInput := models.TagCategoryUpdateInput{
		ID:          catID,
		Description: &newDescription,
	}

	updatedCategory, err := s.resolver.Mutation().TagCategoryUpdate(s.ctx, updateInput)
	assert.NilError(s.t, err, "Error updating tagCategory")

	s.verifyUpdatedTagCategory(updateInput, updatedCategory)
}

func (s *tagCategoryTestRunner) verifyUpdatedTagCategory(input models.TagCategoryUpdateInput, category *models.TagCategory) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, input.Name == nil || (*input.Name == category.Name))

	r := s.resolver.TagCategory()

	description, _ := r.Description(s.ctx, category)
	assert.DeepEqual(s.t, description, input.Description)
}

func (s *tagCategoryTestRunner) testDestroyTagCategory() {
	createdCategory, err := s.createTestTagCategory(nil)
	assert.NilError(s.t, err)

	catID := createdCategory.ID

	destroyed, err := s.resolver.Mutation().TagCategoryDestroy(s.ctx, models.TagCategoryDestroyInput{
		ID: catID,
	})
	assert.NilError(s.t, err, "Error destroying tagCategory")

	assert.Assert(s.t, destroyed, "TagCategory was not destroyed")

	// ensure cannot find tagCategory
	foundTagCategory, err := s.resolver.Query().FindTagCategory(s.ctx, catID)
	assert.NilError(s.t, err, "Error finding tagCategory after destroying")

	assert.Assert(s.t, foundTagCategory == nil, "Found tagCategory after destruction")
}

func TestCreateTagCategory(t *testing.T) {
	pt := createTagCategoryTestRunner(t)
	pt.testCreateTagCategory()
}

func TestUpdateTagCategory(t *testing.T) {
	pt := createTagCategoryTestRunner(t)
	pt.testUpdateTagCategory()
}

func TestDestroyTagCategory(t *testing.T) {
	pt := createTagCategoryTestRunner(t)
	pt.testDestroyTagCategory()
}
