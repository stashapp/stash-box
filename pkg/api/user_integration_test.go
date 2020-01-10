// +build integration

package api_test

import (
	"strconv"
	"testing"

	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

type userTestRunner struct {
	testRunner
	userSuffix int
}

func createUserTestRunner(t *testing.T) *userTestRunner {
	return &userTestRunner{
		testRunner: *createTestRunner(t),
	}
}

func (s *userTestRunner) generateUserName() string {
	s.userSuffix += 1
	return "userTestRunner-" + strconv.Itoa(s.userSuffix)
}

func (s *userTestRunner) testCreateUser() {
	name := s.generateUserName()
	input := models.UserCreateInput{
		Name:     name,
		Password: "password",
		Email:    name,
		Roles: []models.RoleEnum{
			models.RoleEnumAdmin,
		},
	}

	user, err := s.resolver.Mutation().UserCreate(s.ctx, input)

	if err != nil {
		s.t.Errorf("Error creating user: %s", err.Error())
		return
	}

	s.verifyCreatedUser(input, user)
}

func (s *userTestRunner) verifyCreatedUser(input models.UserCreateInput, user *models.User) {
	// ensure basic attributes are set correctly
	if input.Name != user.Name {
		s.fieldMismatch(input.Name, user.Name, "Name")
	}

	if input.Email != user.Email {
		s.fieldMismatch(input.Email, user.Email, "Email")
	}

	r := s.resolver.User()

	id, _ := r.ID(s.ctx, user)
	if id == "" {
		s.t.Errorf("Expected created user id to be non-zero")
	}

	// TODO - ensure roles are set

}

func (s *userTestRunner) testFindUserById() {
	createdUser, err := s.createTestUser(nil)
	if err != nil {
		return
	}

	userID := createdUser.ID.String()
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	if err != nil {
		s.t.Errorf("Error finding user: %s", err.Error())
		return
	}

	// ensure returned user is not nil
	if user == nil {
		s.t.Error("Did not find user by id")
		return
	}

	// ensure values were set
	if createdUser.Name != user.Name {
		s.fieldMismatch(createdUser.Name, user.Name, "Name")
	}
}

func (s *userTestRunner) testFindUserByName() {
	createdUser, err := s.createTestUser(nil)
	if err != nil {
		return
	}

	userName := createdUser.Name
	user, err := s.resolver.Query().FindUser(s.ctx, nil, &userName)
	if err != nil {
		s.t.Errorf("Error finding user: %s", err.Error())
		return
	}

	// ensure returned user is not nil
	if user == nil {
		s.t.Error("Did not find user by name")
		return
	}

	// ensure values were set
	if createdUser.Name != user.Name {
		s.fieldMismatch(createdUser.Name, user.Name, "Name")
	}
}

func (s *userTestRunner) testUpdateUserName() {
	input := &models.UserCreateInput{
		Name: s.generateUserName(),
	}

	createdUser, err := s.createTestUser(input)
	if err != nil {
		return
	}

	userID := createdUser.ID.String()

	updatedName := s.generateUserName()
	updateInput := models.UserUpdateInput{
		ID:   userID,
		Name: &updatedName,
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"name",
	})
	updatedUser, err := s.resolver.Mutation().UserUpdate(ctx, updateInput)
	if err != nil {
		s.t.Errorf("Error updating user: %s", err.Error())
		return
	}

	input.Name = updatedName
	s.verifyCreatedUser(*input, updatedUser)
}

func (s *userTestRunner) verifyUpdatedUser(input models.UserUpdateInput, user *models.User) {
	// ensure basic attributes are set correctly
	if input.Name != nil && *input.Name != user.Name {
		s.fieldMismatch(input.Name, user.Name, "Name")
	}
}

func (s *userTestRunner) testDestroyUser() {
	createdUser, err := s.createTestUser(nil)
	if err != nil {
		return
	}

	userID := createdUser.ID.String()

	destroyed, err := s.resolver.Mutation().UserDestroy(s.ctx, models.UserDestroyInput{
		ID: userID,
	})
	if err != nil {
		s.t.Errorf("Error destroying user: %s", err.Error())
		return
	}

	if !destroyed {
		s.t.Error("User was not destroyed")
		return
	}

	// ensure cannot find user
	foundUser, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	if err != nil {
		s.t.Errorf("Error finding user after destroying: %s", err.Error())
		return
	}

	if foundUser != nil {
		s.t.Error("Found user after destruction")
	}
}

func TestCreateUser(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testCreateUser()
}

func TestFindUserById(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testFindUserById()
}

func TestFindUserByName(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testFindUserByName()
}

func TestUpdateUserName(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUpdateUserName()
}

func TestDestroyUser(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testDestroyUser()
}
