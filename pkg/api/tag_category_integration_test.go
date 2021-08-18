// +build integration

package api_test

import (
	"reflect"
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
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

	if err != nil {
		s.t.Errorf("Error creating tagCategory: %s", err.Error())
		return
	}

	s.verifyCreatedTagCategory(input, category)
}

func (s *tagCategoryTestRunner) verifyCreatedTagCategory(input models.TagCategoryCreateInput, category *models.TagCategory) {
	// ensure basic attributes are set correctly
	if input.Name != category.Name {
		s.fieldMismatch(input.Name, category.Name, "Name")
	}

	r := s.resolver.TagCategory()

	id, _ := r.ID(s.ctx, category)
	if id == "" {
		s.t.Errorf("Expected created tagCategory id to be non-zero")
	}

	if v, _ := r.Description(s.ctx, category); !reflect.DeepEqual(v, input.Description) {
		s.fieldMismatch(*input.Description, v, "Description")
	}
	if v, _ := r.Group(s.ctx, category); !reflect.DeepEqual(v, models.TagGroupEnumPeople) {
		s.fieldMismatch(input.Group, v, "Group")
	}
}

func (s *tagCategoryTestRunner) testFindTagCategoryById() {
	createdCategory, err := s.createTestTagCategory(nil)
	if err != nil {
		return
	}

	catID := createdCategory.ID.String()
	category, err := s.resolver.Query().FindTagCategory(s.ctx, catID)
	if err != nil {
		s.t.Errorf("Error finding tagCategory: %s", err.Error())
		return
	}

	// ensure returned tagCategory is not nil
	if category == nil {
		s.t.Error("Did not find tagCategory by id")
		return
	}

	// ensure values were set
	if createdCategory.Name != category.Name {
		s.fieldMismatch(createdCategory.Name, category.Name, "Name")
	}
}

func (s *tagCategoryTestRunner) testUpdateTagCategory() {
	createdCategory, err := s.createTestTagCategory(nil)
	if err != nil {
		return
	}

	catID := createdCategory.ID.String()

	newDescription := "newDescription"

	updateInput := models.TagCategoryUpdateInput{
		ID:          catID,
		Description: &newDescription,
	}

	updatedCategory, err := s.resolver.Mutation().TagCategoryUpdate(s.ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating tagCategory: %s", err.Error())
		return
	}

	s.verifyUpdatedTagCategory(updateInput, updatedCategory)
}

func (s *tagCategoryTestRunner) verifyUpdatedTagCategory(input models.TagCategoryUpdateInput, category *models.TagCategory) {
	// ensure basic attributes are set correctly
	if input.Name != nil && *input.Name != category.Name {
		s.fieldMismatch(*input.Name, category.Name, "Name")
	}

	r := s.resolver.TagCategory()

	if v, _ := r.Description(s.ctx, category); !reflect.DeepEqual(v, input.Description) {
		s.fieldMismatch(input.Description, v, "Description")
	}
}

func (s *tagCategoryTestRunner) testDestroyTagCategory() {
	createdCategory, err := s.createTestTagCategory(nil)
	if err != nil {
		return
	}

	catID := createdCategory.ID.String()

	destroyed, err := s.resolver.Mutation().TagCategoryDestroy(s.ctx, models.TagCategoryDestroyInput{
		ID: catID,
	})
	if err != nil {
		s.t.Errorf("Error destroying tagCategory: %s", err.Error())
		return
	}

	if !destroyed {
		s.t.Error("TagCategory was not destroyed")
		return
	}

	// ensure cannot find tagCategory
	foundTagCategory, err := s.resolver.Query().FindTagCategory(s.ctx, catID)
	if err != nil {
		s.t.Errorf("Error finding tagCategory after destroying: %s", err.Error())
		return
	}

	if foundTagCategory != nil {
		s.t.Error("Found tagCategory after destruction")
	}
}

func (s *tagCategoryTestRunner) testUnauthorisedTagCategoryModify() {
	// test each api interface - all require admin so all should fail
	_, err := s.resolver.Mutation().TagCategoryCreate(s.ctx, models.TagCategoryCreateInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCategoryCreate: got %v want %v", err, user.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().TagCategoryUpdate(s.ctx, models.TagCategoryUpdateInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCategoryUpdate: got %v want %v", err, user.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().TagCategoryDestroy(s.ctx, models.TagCategoryDestroyInput{})
	if err != user.ErrUnauthorized {
		s.t.Errorf("TagCategoryDestroy: got %v want %v", err, user.ErrUnauthorized)
	}
}

func (s *tagTestRunner) testUnauthorisedTagCategoryQuery() {
	_, err := s.resolver.Query().FindTagCategory(s.ctx, "")
	if err != user.ErrUnauthorized {
		s.t.Errorf("FindTagCategory: got %v want %v", err, user.ErrUnauthorized)
	}

	_, err = s.resolver.Query().QueryTagCategories(s.ctx, nil)
	if err != user.ErrUnauthorized {
		s.t.Errorf("QueryTagCategories: got %v want %v", err, user.ErrUnauthorized)
	}
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

func TestUnauthorisedTagCategoryAdmin(t *testing.T) {
	pt := &tagCategoryTestRunner{
		testRunner: *asEdit(t),
	}
	pt.testUnauthorisedTagCategoryModify()
}

func TestUnauthorisedTagCategoryQuery(t *testing.T) {
	pt := &tagTestRunner{
		testRunner: *asNone(t),
	}
	pt.testUnauthorisedTagCategoryQuery()
}
