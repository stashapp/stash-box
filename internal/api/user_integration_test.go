//go:build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
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
	assert.NoError(s.t, err, "Error creating user")

	s.verifyCreatedUser(input, user)
}

func (s *userTestRunner) verifyCreatedUser(input models.UserCreateInput, user *models.User) {
	// ensure basic attributes are set correctly
	assert.Equal(s.t, input.Name, user.Name)
	assert.Equal(s.t, input.Email, user.Email)

	// ensure apikey is set
	assert.True(s.t, user.APIKey != "", "API key was not generated")
	assert.True(s.t, user.PasswordHash != "", "Password was not set")
	assert.True(s.t, user.ID != uuid.Nil, "Expected created user id to be non-zero")

	// TODO - ensure roles are set

}

func (s *userTestRunner) testFindUserById() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NoError(s.t, err)

	user, err := s.resolver.Query().FindUser(s.ctx, &createdUser.ID, nil)
	assert.NoError(s.t, err, "Error finding user")

	// ensure returned user is not nil
	assert.NotNil(s.t, user, "Did not find user by id")

	// ensure values were set
	assert.Equal(s.t, createdUser.Name, user.Name)
}

func (s *userTestRunner) testFindUserByName() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NoError(s.t, err)

	userName := createdUser.Name
	user, err := s.resolver.Query().FindUser(s.ctx, nil, &userName)
	assert.NoError(s.t, err, "Error finding user")

	// ensure returned user is not nil
	assert.NotNil(s.t, user, "Did not find user by name")

	// ensure values were set
	assert.Equal(s.t, createdUser.Name, user.Name)
}

func (s *userTestRunner) testQueryUserByName() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NoError(s.t, err)

	userName := createdUser.Name

	input := models.UserQueryInput{
		Name:    &userName,
		Page:    1,
		PerPage: 1,
	}

	result, err := s.resolver.Query().QueryUsers(s.ctx, input)
	assert.NoError(s.t, err, "Error querying user")

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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err, "Error updating user")

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
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err, "Error updating user")

	// ensure password is set
	assert.True(s.t, updatedUser.PasswordHash != "", "Password was not set")
	assert.True(s.t, updatedUser.PasswordHash != oldPassword, "Password was not changed")
}

func (s *userTestRunner) verifyUpdatedUser(input models.UserUpdateInput, user *models.User) {
	// ensure basic attributes are set correctly
	assert.True(s.t, input.Name == nil || *input.Name == user.Name)
}

func (s *userTestRunner) testDestroyUser() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NoError(s.t, err)

	userID := createdUser.ID

	destroyed, err := s.resolver.Mutation().UserDestroy(s.ctx, models.UserDestroyInput{
		ID: userID,
	})
	assert.NoError(s.t, err, "Error destroying user")

	assert.True(s.t, destroyed, "User was not destroyed")

	// ensure cannot find user
	foundUser, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NoError(s.t, err, "Error finding user after destroying")

	assert.Nil(s.t, foundUser, "Found user after destruction")
}

func (s *userTestRunner) testUserQuery() {
	userName := userDB.admin.Name

	input := models.UserQueryInput{
		Name:    &userName,
		Page:    1,
		PerPage: 1,
	}

	users, err := s.resolver.Query().QueryUsers(s.ctx, input)
	assert.NoError(s.t, err)

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
	assert.NoError(s.t, err)

	// change password as the test user
	ctx := context.TODO()
	ctx = context.WithValue(ctx, auth.ContextUser, createdUser)

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
	assert.NoError(s.t, err, "Error changing password")
}

func (s *userTestRunner) testRegenerateAPIKey() {
	name := s.generateUserName()
	input := &models.UserCreateInput{
		Name:     name,
		Email:    name + "@example.com",
		Password: "password" + name,
	}

	createdUser, err := s.createTestUser(input, nil)
	assert.NoError(s.t, err)

	oldKey := createdUser.APIKey

	// regenerate as the test user
	ctx := context.TODO()
	ctx = context.WithValue(ctx, auth.ContextUser, createdUser)

	adminID := userDB.admin.ID
	_, err = s.resolver.Mutation().RegenerateAPIKey(ctx, &adminID)
	assert.Error(s.t, err, "not authorized", "Expected error for changing other user API key")

	// wait one second before regenerating to ensure a new key is created
	time.Sleep(1 * time.Second)
	newKey, err := s.resolver.Mutation().RegenerateAPIKey(ctx, nil)
	assert.NoError(s.t, err, "Error regenerating API key")

	assert.True(s.t, newKey != "", "Regenerated API key is empty")

	assert.True(s.t, newKey != oldKey, "Regenerated API key is same as old key")

	userID := createdUser.ID
	user, err := s.resolver.Query().FindUser(s.ctx, &userID, nil)
	assert.NoError(s.t, err, "Error finding user")

	assert.Equal(s.t, user.APIKey, newKey, "Returned API key s is different to stored key")
}

func (s *userTestRunner) testUserEditQuery() {
	createdUser, err := s.createTestUser(nil, nil)
	assert.NoError(s.t, err)

	userID := createdUser.ID
	filter := models.EditQueryInput{
		UserID: &userID,
	}
	_, err = s.resolver.Query().QueryEdits(s.ctx, filter)
	assert.NoError(s.t, err, "Error finding user edits")

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

func (s *userTestRunner) testMeQuery() {
	// Test me query returns current authenticated user
	me, err := s.client.me()
	assert.NoError(s.t, err, "Error getting current user")

	assert.NotNil(s.t, me, "me query returned nil")
	assert.Equal(s.t, userDB.admin.ID.String(), me.ID, "me query returned wrong user")
	assert.Equal(s.t, userDB.admin.Name, me.Name, "me query returned wrong user name")
}

func (s *userTestRunner) testFavoritePerformer() {
	// Create a test performer
	performer, err := s.createTestPerformer(nil)
	assert.NoError(s.t, err)

	performerID := performer.UUID()

	// Favorite the performer
	result, err := s.client.favoritePerformer(performerID, true)
	assert.NoError(s.t, err, "Error favoriting performer")
	assert.True(s.t, result, "Expected favoritePerformer to return true")

	// Unfavorite the performer
	result, err = s.client.favoritePerformer(performerID, false)
	assert.NoError(s.t, err, "Error unfavoriting performer")
	assert.True(s.t, result, "Expected favoritePerformer to return true")
}

func (s *userTestRunner) testFavoriteStudio() {
	// Create a test studio
	studio, err := s.createTestStudio(nil)
	assert.NoError(s.t, err)

	studioID := studio.UUID()

	// Favorite the studio
	result, err := s.client.favoriteStudio(studioID, true)
	assert.NoError(s.t, err, "Error favoriting studio")
	assert.True(s.t, result, "Expected favoriteStudio to return true")

	// Unfavorite the studio
	result, err = s.client.favoriteStudio(studioID, false)
	assert.NoError(s.t, err, "Error unfavoriting studio")
	assert.True(s.t, result, "Expected favoriteStudio to return true")
}

func TestMeQuery(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testMeQuery()
}

func TestFavoritePerformer(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testFavoritePerformer()
}

func TestFavoriteStudio(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testFavoriteStudio()
}

func (s *userTestRunner) testQueryNotifications() {
	input := models.QueryNotificationsInput{
		Page:    1,
		PerPage: 25,
	}

	result, err := s.client.queryNotifications(input)
	assert.NoError(s.t, err, "Error querying notifications")
	assert.NotNil(s.t, result, "Result should not be nil")
	assert.NotNil(s.t, result.Notifications, "Notifications should not be nil")
}

func (s *userTestRunner) testGetUnreadNotificationCount() {
	count, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err, "Error getting unread notification count")
	assert.True(s.t, count >= 0, "Count should be non-negative")
}

func (s *userTestRunner) testUpdateNotificationSubscriptions() {
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumFavoritePerformerScene,
		models.NotificationEnumFavoriteStudioScene,
	}

	result, err := s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err, "Error updating notification subscriptions")
	assert.True(s.t, result, "Update should return true")
}

func TestQueryNotifications(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testQueryNotifications()
}

func TestGetUnreadNotificationCount(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testGetUnreadNotificationCount()
}

func TestUpdateNotificationSubscriptions(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testUpdateNotificationSubscriptions()
}

func (s *userTestRunner) testNewUser() {
	// Grant invite tokens to the admin user
	adminID := userDB.admin.ID
	_, err := s.resolver.Mutation().GrantInvite(s.ctx, models.GrantInviteInput{
		UserID: adminID,
		Amount: 10,
	})
	assert.NoError(s.t, err, "Error granting invite tokens")

	// Generate an invite key if required
	inviteKey, err := s.resolver.Mutation().GenerateInviteCode(s.ctx)
	assert.NoError(s.t, err, "Error generating invite key")

	// Test 1: NewUser with valid email should succeed
	email := "newuser@example.com"
	input := models.NewUserInput{
		Email:     email,
		InviteKey: inviteKey,
	}

	activationKey, err := s.resolver.Mutation().NewUser(s.ctx, input)
	assert.NoError(s.t, err, "Error calling NewUser with valid email")
	assert.NotNil(s.t, activationKey, "Activation key should not be nil")

	// Test 2: NewUser with same email should fail (pending activation exists)
	inviteKey2, err := s.resolver.Mutation().GenerateInviteCode(s.ctx)
	assert.NoError(s.t, err, "Error generating second invite key")

	input.InviteKey = inviteKey2
	_, err = s.resolver.Mutation().NewUser(s.ctx, input)
	assert.Error(s.t, err, "Expected error when email has pending activation")
	assert.Contains(s.t, err.Error(), "email already has a pending activation", "Error should mention pending activation")

	// Test 3: NewUser with existing user email should fail
	inviteKey3, err := s.resolver.Mutation().GenerateInviteCode(s.ctx)
	assert.NoError(s.t, err, "Error generating third invite key")

	existingEmail := userDB.admin.Email
	input2 := models.NewUserInput{
		Email:     existingEmail,
		InviteKey: inviteKey3,
	}

	_, err = s.resolver.Mutation().NewUser(s.ctx, input2)
	assert.Error(s.t, err, "Expected error when email already in use")
	assert.Contains(s.t, err.Error(), "email already in use", "Error should mention email already in use")
}

func TestNewUser(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testNewUser()
}

func (s *userTestRunner) testRescindInviteKey() {
	// Grant invite tokens to the admin user
	adminID := userDB.admin.ID
	_, err := s.resolver.Mutation().GrantInvite(s.ctx, models.GrantInviteInput{
		UserID: adminID,
		Amount: 10,
	})
	assert.NoError(s.t, err, "Error granting invite tokens")

	// Test 1: Rescind an unused invite key should succeed
	unusedKey, err := s.resolver.Mutation().GenerateInviteCode(s.ctx)
	assert.NoError(s.t, err, "Error generating unused invite key")
	assert.NotNil(s.t, unusedKey, "Unused invite key should not be nil")

	result, err := s.resolver.Mutation().RescindInviteCode(s.ctx, *unusedKey)
	assert.NoError(s.t, err, "Error rescinding unused invite key")
	assert.True(s.t, result, "Expected rescindInviteCode to return true for unused key")

	// Test 2: Rescind an invite key that has been used should fail
	usedKey, err := s.resolver.Mutation().GenerateInviteCode(s.ctx)
	assert.NoError(s.t, err, "Error generating invite key")
	assert.NotNil(s.t, usedKey, "Invite key should not be nil")

	// Use the invite key to create a new user (this creates a user_token referencing the invite key)
	email := "rescind_test_user@example.com"
	input := models.NewUserInput{
		Email:     email,
		InviteKey: usedKey,
	}

	activationKey, err := s.resolver.Mutation().NewUser(s.ctx, input)
	assert.NoError(s.t, err, "Error calling NewUser with invite key")
	assert.NotNil(s.t, activationKey, "Activation key should not be nil")

	// Try to rescind the used invite key - this should fail
	_, err = s.resolver.Mutation().RescindInviteCode(s.ctx, *usedKey)
	assert.Error(s.t, err, "Expected error when rescinding a used invite key")
	assert.Contains(s.t, err.Error(), "already been used", "Error should mention key has been used")
}

func TestRescindInviteKey(t *testing.T) {
	pt := createUserTestRunner(t)
	pt.testRescindInviteKey()
}
