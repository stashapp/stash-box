//go:build integration
// +build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
	"gotest.tools/v3/assert"
)

type userTestRunner struct {
	testRunner
}

func createUserTestRunner(t *testing.T) *userTestRunner {
	return &userTestRunner{
		testRunner: *asAdmin(t),
	}
}

func (s *userTestRunner) testCreateUser() {
	name := s.generateUserName()
	input := models.UserCreateInput{
		Name:     name,
		Password: "password" + name,
		Email:    name + "@example.com",
		Roles: []models.RoleEnum{
			models.RoleEnumAdmin,
		},
	}

	user, err := s.resolver.Mutation().UserCreate(s.ctx, input)
	assert.NilError(s.t, err, "Error creating user")

	s.verifyCreatedUser(input, user)
}

func (s *userTestRunner) verifyCreatedUser(input models.UserCreateInput, user *models.User) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, user.Name)
	assert.Equal(s.t, input.Email, user.Email)

	// ensure apikey is set
	assert.Assert(s.t, user.APIKey != "", "API key was not generated")
	assert.Assert(s.t, user.PasswordHash != "", "Password was not set")
	assert.Assert(s.t, user.ID != uuid.Nil, "Expected created user id to be non-zero")

	// TODO - ensure roles are set

}

func (s *userTestRunner) testFindUserById() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NilError(s.t, err)

	user, err := s.resolver.Query().FindUser(s.ctx, &createdUser.ID, nil)
	assert.NilError(s.t, err, "Error finding user")

	// ensure returned user is not nil
	assert.Assert(s.t, user != nil, "Did not find user by id")

	// ensure values were set
	assert.Equal(s.t, createdUser.Name, user.Name)
}

func (s *userTestRunner) testFindUserByName() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NilError(s.t, err)

	userName := createdUser.Name
	user, err := s.resolver.Query().FindUser(s.ctx, nil, &userName)
	assert.NilError(s.t, err, "Error finding user")

	// ensure returned user is not nil
	assert.Assert(s.t, user != nil, "Did not find user by name")

	// ensure values were set
	assert.Equal(s.t, createdUser.Name, user.Name)
}

func (s *userTestRunner) testQueryUserByName() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NilError(s.t, err)

	userName := createdUser.Name

	input := models.UserQueryInput{
		Name:    &userName,
		Page:    1,
		PerPage: 1,
	}

	result, err := s.resolver.Query().QueryUsers(s.ctx, input)
	assert.NilError(s.t, err, "Error querying user")

	// ensure one result was returned
	assert.Equal(s.t, result.Count, 1, "Expected 1 user")

	// ensure values were set
	assert.Equal(s.t, createdUser.Name, result.Users[0].Name)
}

func (s *userTestRunner) testUpdateUserName() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
	}

	createdUser, err := s.createTestUser(input, nil)
	assert.NilError(s.t, err)

	userID := createdUser.ID

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
	assert.NilError(s.t, err, "Error updating user")

	input.Name = updatedName
	s.verifyCreatedUser(*input, updatedUser)
}

func (s *userTestRunner) testUpdatePassword() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
	}

	createdUser, err := s.createTestUser(input, nil)
	assert.NilError(s.t, err)

	userID := createdUser.ID
	oldPassword := createdUser.PasswordHash

	updatedPassword := s.generateUserName() + "newpassword"
	updateInput := models.UserUpdateInput{
		ID:       userID,
		Password: &updatedPassword,
	}

	// need some mocking of the context to make the field ignore behaviour work
	ctx := s.updateContext([]string{
		"password",
	})
	updatedUser, err := s.resolver.Mutation().UserUpdate(ctx, updateInput)
	assert.NilError(s.t, err, "Error updating user")

	// ensure password is set
	assert.Assert(s.t, updatedUser.PasswordHash != "", "Password was not set")
	assert.Assert(s.t, updatedUser.PasswordHash != oldPassword, "Password was not changed")
}

func (s *userTestRunner) verifyUpdatedUser(input models.UserUpdateInput, user *models.User) {
	// ensure basic attributes are set correctly
	assert.Assert(s.t, input.Name == nil || *input.Name == user.Name)
}

func (s *userTestRunner) testDestroyUser() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NilError(s.t, err)

	userID := createdUser.ID

	destroyed, err := s.resolver.Mutation().UserDestroy(s.ctx, models.UserDestroyInput{
		ID: userID,
	})
	assert.NilError(s.t, err, "Error destroying user")

	assert.Assert(s.t, destroyed, "User was not destroyed")

	// ensure cannot find user
	foundUser, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NilError(s.t, err, "Error finding user after destroying")

	assert.Assert(s.t, foundUser == nil, "Found user after destruction")
}

func (s *userTestRunner) testUserQuery() {
	userName := userDB.admin.Name

	input := models.UserQueryInput{
		Name:    &userName,
		Page:    1,
		PerPage: 1,
	}

	users, err := s.resolver.Query().QueryUsers(s.ctx, input)
	assert.NilError(s.t, err)

	assert.Equal(s.t, len(users.Users), 1, "QueryUsers: admin user not found")
}

func (s *userTestRunner) testChangePassword() {
	name := s.generateUserName()
	oldPassword := "password" + name
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: oldPassword,
	}

	createdUser, err := s.createTestUser(input, nil)
	assert.NilError(s.t, err)

	// change password as the test user
	ctx := context.TODO()
	ctx = context.WithValue(ctx, user.ContextUser, createdUser)

	updatedPassword := name + "newpassword"
	existingPassword := "incorrect password"
	updateInput := models.UserChangePasswordInput{
		ExistingPassword: &existingPassword,
		NewPassword:      updatedPassword,
	}

	_, err = s.resolver.Mutation().ChangePassword(ctx, updateInput)
	assert.Error(s.t, err, "current password incorrect", "Expected error for incorrect current password")

	updateInput.ExistingPassword = &oldPassword
	updateInput.NewPassword = "aaa"

	_, err = s.resolver.Mutation().ChangePassword(ctx, updateInput)
	assert.Error(s.t, err, "password length < 8", "Expected error for invalid new password")

	updateInput.NewPassword = updatedPassword
	_, err = s.resolver.Mutation().ChangePassword(ctx, updateInput)
	assert.NilError(s.t, err, "Error changing password")
}

func (s *userTestRunner) testRegenerateAPIKey() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
	}

	createdUser, err := s.createTestUser(input, nil)
	assert.NilError(s.t, err)

	oldKey := createdUser.APIKey

	// regenerate as the test user
	ctx := context.TODO()
	ctx = context.WithValue(ctx, user.ContextUser, createdUser)

	adminID := userDB.admin.ID
	_, err = s.resolver.Mutation().RegenerateAPIKey(ctx, &adminID)
	assert.Error(s.t, err, "Not authorized", "Expected error for changing other user API key")

	// wait one second before regenerating to ensure a new key is created
	time.Sleep(1 * time.Second)
	newKey, err := s.resolver.Mutation().RegenerateAPIKey(ctx, nil)
	assert.NilError(s.t, err, "Error regenerating API key")

	assert.Assert(s.t, newKey != "", "Regenerated API key is empty")

	assert.Assert(s.t, newKey != oldKey, "Regenerated API key is same as old key")

	userID := createdUser.ID
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NilError(s.t, err, "Error finding user")

	assert.Equal(s.t, user.APIKey, newKey, "Returned API key s is different to stored key")
}

func (s *userTestRunner) testUserEditQuery() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NilError(s.t, err)

	userID := createdUser.ID
	filter := models.EditQueryInput{
		UserID: &userID,
	}
	_, err = s.resolver.Query().QueryEdits(s.ctx, filter)
	assert.NilError(s.t, err, "Error finding user edits")

	// TODO: Test edits are returned
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

func TestQueryUserByName(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testQueryUserByName()
}

func TestUpdateUserName(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUpdateUserName()
}

func TestUpdateUserPassword(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUpdatePassword()
}

func TestDestroyUser(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testDestroyUser()
}

func TestUserQuery(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUserQuery()
}

func TestChangePassword(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testChangePassword()
}

func TestRegenerateAPIKey(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testRegenerateAPIKey()
}

func TestUserEditQuery(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUserEditQuery()
}
