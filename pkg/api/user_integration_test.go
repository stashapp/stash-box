// +build integration

package api_test

import (
	"testing"

	"github.com/stashapp/stashdb/pkg/api"
	"github.com/stashapp/stashdb/pkg/models"

	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
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

	// ensure apikey is set
	if user.APIKey == "" {
		s.t.Errorf("API key was not generated")
	}

	// ensure password is set
	if user.PasswordHash == "" {
		s.t.Errorf("Password was not set")
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

func (s *userTestRunner) testQueryUserByName() {
	createdUser, err := s.createTestUser(nil)
	if err != nil {
		return
	}

	userName := createdUser.Name

	userFilter := models.UserFilterType{
		Name: &userName,
	}
	page := 1
	perPage := 1
	filter := models.QuerySpec{
		Page:    &page,
		PerPage: &perPage,
	}

	result, err := s.resolver.Query().QueryUsers(s.ctx, &userFilter, &filter)
	if err != nil {
		s.t.Errorf("Error querying user: %s", err.Error())
		return
	}

	// ensure one result was returned
	if result.Count != 1 {
		s.t.Errorf("Expected %d users, got %d", 1, result.Count)
		return
	}

	user := result.Users[0]

	// ensure values were set
	if createdUser.Name != user.Name {
		s.fieldMismatch(createdUser.Name, user.Name, "Name")
	}
}

func (s *userTestRunner) testUpdateUserName() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
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

func (s *userTestRunner) testUpdatePassword() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
	}

	createdUser, err := s.createTestUser(input)
	if err != nil {
		return
	}

	userID := createdUser.ID.String()
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
	if err != nil {
		s.t.Errorf("Error updating user: %s", err.Error())
		return
	}

	// ensure password is set
	if updatedUser.PasswordHash == "" {
		s.t.Errorf("Password was not set")
	}

	if updatedUser.PasswordHash == oldPassword {
		s.t.Error("Password was not changed")
	}
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

func (s *userTestRunner) testUnauthorisedUserMutate() {
	// test each api interface - all require admin so all should fail
	_, err := s.resolver.Mutation().UserCreate(s.ctx, models.UserCreateInput{})
	if err != api.ErrUnauthorized {
		s.t.Errorf("UserCreate: got %v want %v", err, api.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().UserUpdate(s.ctx, models.UserUpdateInput{})
	if err != api.ErrUnauthorized {
		s.t.Errorf("UserUpdate: got %v want %v", err, api.ErrUnauthorized)
	}

	_, err = s.resolver.Mutation().UserDestroy(s.ctx, models.UserDestroyInput{})
	if err != api.ErrUnauthorized {
		s.t.Errorf("UserDestroy: got %v want %v", err, api.ErrUnauthorized)
	}
}

func (s *userTestRunner) ensureDetailsRemoved(user *models.User) {
	s.t.Helper()

	if user.APIKey != "" {
		s.t.Error("API key shown for unauthorised user")
	}

	if user.Email != "" {
		s.t.Error("Email shown for unauthorised user")
	}
}

func (s *userTestRunner) testUnauthorisedUserFind() {
	// find different user
	userID := userDB.admin.ID.String()
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	if err != nil {
		s.t.Errorf("FindUser: got %v want %v", err, nil)
		return
	}

	if user == nil {
		s.t.Error("FindUser: admin user not found")
		return
	}

	s.ensureDetailsRemoved(user)
}

func (s *userTestRunner) testUnauthorisedUserQuery() {
	userName := userDB.admin.Name

	userFilter := models.UserFilterType{
		Name: &userName,
	}
	page := 1
	perPage := 1
	filter := models.QuerySpec{
		Page:    &page,
		PerPage: &perPage,
	}

	users, err := s.resolver.Query().QueryUsers(s.ctx, &userFilter, &filter)
	if err != nil {
		s.t.Errorf("QueryUsers: got %v want %v", err, nil)
		return
	}

	if len(users.Users) != 1 {
		s.t.Error("QueryUsers: admin user not found")
		return
	}

	s.ensureDetailsRemoved(users.Users[0])
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

func TestUnauthorisedUserMutate(t *testing.T) {
	pt := &userTestRunner{
		testRunner: *asModify(t),
	}
	pt.testUnauthorisedUserMutate()
}

func TestUnauthorisedUserFind(t *testing.T) {
	pt := &userTestRunner{
		testRunner: *asModify(t),
	}
	pt.testUnauthorisedUserFind()
}

func TestUnauthorisedUserQuery(t *testing.T) {
	pt := &userTestRunner{
		testRunner: *asModify(t),
	}
	pt.testUnauthorisedUserQuery()
}
