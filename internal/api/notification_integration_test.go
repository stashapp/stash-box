//go:build integration

package api_test

import (
	"context"
	"testing"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stretchr/testify/assert"
)

type notificationTestRunner struct {
	testRunner
}

func createNotificationTestRunner(t *testing.T) *notificationTestRunner {
	return &notificationTestRunner{
		testRunner: *asEdit(t),
	}
}

// testNotificationOnCommentOwnEdit tests that a notification is created when someone comments on the user's own edit
func (s *notificationTestRunner) testNotificationOnCommentOwnEdit() {
	// Create an edit as the main test user
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Subscribe to comment notifications
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumCommentOwnEdit,
	}
	_, err = s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Get initial unread count
	initialUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	// Create another user and have them comment on the edit
	commenterUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
	assert.NoError(s.t, err)

	commenterCtx := context.WithValue(s.ctx, auth.ContextUser, commenterUser)
	commentText := "Test comment on edit"
	_, err = s.resolver.Mutation().EditComment(commenterCtx, models.EditCommentInput{
		ID:      createdEdit.ID,
		Comment: commentText,
	})
	assert.NoError(s.t, err)

	// Small delay to ensure notification is created
	time.Sleep(100 * time.Millisecond)

	// Verify unread count increased
	newUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, newUnreadCount > initialUnreadCount, "Unread count should have increased after comment")

	// Query notifications to verify the notification was created
	result, err := s.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    25,
		UnreadOnly: pointerTo(true),
	})
	assert.NoError(s.t, err)
	assert.True(s.t, len(result.Notifications) > 0, "Should have at least one unread notification")

	// Find the notification we just created
	foundNotification := false
	for _, notification := range result.Notifications {
		if !notification.Read {
			foundNotification = true
			break
		}
	}
	assert.True(s.t, foundNotification, "Should find an unread notification")
}

// testNotificationOnDownvoteOwnEdit tests that a notification is created when someone downvotes the user's edit
func (s *notificationTestRunner) testNotificationOnDownvoteOwnEdit() {
	// Create an edit as the main test user
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Subscribe to downvote notifications
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumDownvoteOwnEdit,
	}
	_, err = s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Get initial unread count
	initialUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	// Create a user with vote role and have them downvote the edit
	voterUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumVote})
	assert.NoError(s.t, err)

	voterCtx := context.WithValue(s.ctx, auth.ContextUser, voterUser)
	_, err = s.resolver.Mutation().EditVote(voterCtx, models.EditVoteInput{
		ID:   createdEdit.ID,
		Vote: models.VoteTypeEnumReject,
	})
	assert.NoError(s.t, err)

	// Small delay to ensure notification is created
	time.Sleep(100 * time.Millisecond)

	// Verify unread count increased
	newUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, newUnreadCount > initialUnreadCount, "Unread count should have increased after downvote")

	// Query notifications to verify
	result, err := s.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    25,
		UnreadOnly: pointerTo(true),
	})
	assert.NoError(s.t, err)
	assert.True(s.t, len(result.Notifications) > 0, "Should have at least one unread notification")
}

// testNotificationOnFailedOwnEdit tests that a notification is NOT created when the user cancels their own edit
func (s *notificationTestRunner) testNotificationOnFailedOwnEdit() {
	// Create an edit as the main test user
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Subscribe to failed edit notifications
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumFailedOwnEdit,
	}
	_, err = s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Get initial unread count
	initialUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	// Cancel the edit (which should NOT trigger a notification for self-cancellation)
	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{
		ID: createdEdit.ID,
	})
	assert.NoError(s.t, err)

	// Small delay to ensure any notification would have been created
	time.Sleep(100 * time.Millisecond)

	// Verify unread count did NOT increase (no notification for self-cancellation)
	newUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.Equal(s.t, initialUnreadCount, newUnreadCount, "Unread count should NOT change when user cancels their own edit")
}

// testNotificationOnAdminCancelEdit tests that a notification IS created when an admin cancels/rejects the user's edit
func (s *notificationTestRunner) testNotificationOnAdminCancelEdit() {
	// Create an edit as the main test user
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Subscribe to failed edit notifications
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumFailedOwnEdit,
	}
	_, err = s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Get initial unread count
	initialUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	// Use the existing admin user to cancel the edit
	adminCtx := context.WithValue(s.ctx, auth.ContextUser, userDB.admin)
	adminCtx = context.WithValue(adminCtx, auth.ContextRoles, userDB.adminRoles)
	_, err = s.resolver.Mutation().CancelEdit(adminCtx, models.CancelEditInput{
		ID: createdEdit.ID,
	})
	assert.NoError(s.t, err)

	// Small delay to ensure notification is created
	time.Sleep(100 * time.Millisecond)

	// Verify unread count increased
	newUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, newUnreadCount > initialUnreadCount, "Unread count should have increased after admin cancellation")

	// Query notifications to verify
	result, err := s.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    25,
		UnreadOnly: pointerTo(true),
	})
	assert.NoError(s.t, err)
	assert.True(s.t, len(result.Notifications) > 0, "Should have at least one unread notification")
}

// testMarkSpecificNotificationRead tests marking a specific notification as read
func (s *notificationTestRunner) testMarkSpecificNotificationRead() {
	// First, clear all existing notifications by marking them all as read
	_, _ = s.client.markNotificationsRead(nil)
	time.Sleep(100 * time.Millisecond)

	// Create an edit and trigger a notification
	createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	// Subscribe to comment notifications
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumCommentOwnEdit,
	}
	_, err = s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Create a comment to trigger notification - we need the comment ID for marking as read
	commenterUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
	assert.NoError(s.t, err)

	commenterCtx := context.WithValue(s.ctx, auth.ContextUser, commenterUser)
	editWithComment, err := s.resolver.Mutation().EditComment(commenterCtx, models.EditCommentInput{
		ID:      createdEdit.ID,
		Comment: "Test comment",
	})
	assert.NoError(s.t, err)

	// Get the comment ID from the edit
	comments, err := s.resolver.Edit().Comments(s.ctx, editWithComment)
	assert.NoError(s.t, err)
	assert.True(s.t, len(comments) > 0, "Should have at least one comment")
	commentID := comments[0].ID

	// Wait for notification to be created (increased timeout for CI environments)
	time.Sleep(100 * time.Millisecond)

	// Get unread count before marking as read
	unreadCountBefore, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, unreadCountBefore >= 1, "Should have at least one unread notification")

	// Mark the specific notification as read using the comment ID
	success, err := s.client.markNotificationsRead(&models.MarkNotificationReadInput{
		Type: models.NotificationEnumCommentOwnEdit,
		ID:   commentID,
	})
	assert.NoError(s.t, err)
	assert.True(s.t, success, "Marking notification as read should succeed")

	time.Sleep(100 * time.Millisecond)

	// Verify unread count decreased
	unreadCountAfter, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, unreadCountAfter < unreadCountBefore, "Unread count should have decreased after marking notification as read")

	// Query unread notifications and verify the count decreased
	resultAfter, err := s.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    100,
		UnreadOnly: pointerTo(true),
	})
	assert.NoError(s.t, err)
	assert.True(s.t, len(resultAfter.Notifications) < unreadCountBefore, "Should have fewer unread notifications after marking one as read")
}

// testMarkAllNotificationsRead tests marking all notifications as read
func (s *notificationTestRunner) testMarkAllNotificationsRead() {
	// Subscribe to multiple notification types
	subscriptions := []models.NotificationEnum{
		models.NotificationEnumCommentOwnEdit,
		models.NotificationEnumDownvoteOwnEdit,
		models.NotificationEnumFailedOwnEdit,
	}
	_, err := s.client.updateNotificationSubscriptions(subscriptions)
	assert.NoError(s.t, err)

	// Create multiple edits and trigger multiple notifications
	for i := 0; i < 3; i++ {
		createdEdit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
		assert.NoError(s.t, err)

		// Create a comment to trigger notification
		commenterUser, err := s.createTestUser(nil, []models.RoleEnum{models.RoleEnumEdit})
		assert.NoError(s.t, err)

		commenterCtx := context.WithValue(s.ctx, auth.ContextUser, commenterUser)
		_, err = s.resolver.Mutation().EditComment(commenterCtx, models.EditCommentInput{
			ID:      createdEdit.ID,
			Comment: "Test comment",
		})
		assert.NoError(s.t, err)
	}

	// Wait for all notifications to be created (multiple notifications, so longer wait)
	time.Sleep(200 * time.Millisecond)

	// Verify we have unread notifications
	unreadCountBefore, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, unreadCountBefore >= 3, "Should have at least 3 unread notifications")

	// Mark all notifications as read by passing nil
	success, err := s.client.markNotificationsRead(nil)
	assert.NoError(s.t, err)
	assert.True(s.t, success, "Marking all notifications as read should succeed")

	// Verify unread count is now 0
	unreadCountAfter, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.Equal(s.t, unreadCountAfter, 0, "Unread count should be 0 after marking all as read")

	// Query unread notifications and verify none are returned
	result, err := s.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    25,
		UnreadOnly: pointerTo(true),
	})
	assert.NoError(s.t, err)
	assert.Equal(s.t, len(result.Notifications), 0, "Should have no unread notifications after marking all as read")
}

// Helper function to create a pointer to a boolean
func pointerTo[T any](v T) *T {
	return &v
}

func TestNotificationOnCommentOwnEdit(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testNotificationOnCommentOwnEdit()
}

func TestNotificationOnDownvoteOwnEdit(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testNotificationOnDownvoteOwnEdit()
}

func TestNotificationOnFailedOwnEdit(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testNotificationOnFailedOwnEdit()
}

func TestNotificationOnAdminCancelEdit(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testNotificationOnAdminCancelEdit()
}

func TestMarkSpecificNotificationRead(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testMarkSpecificNotificationRead()
}

func TestMarkAllNotificationsRead(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testMarkAllNotificationsRead()
}

// testNotificationSubscriptionRoleEnforcement tests that READ users can only subscribe to favorite notification types
func (s *notificationTestRunner) testNotificationSubscriptionRoleEnforcement() {
	// Test 1: READ user can subscribe to favorite notification types
	readRunner := asRead(s.t)
	favoriteSubscriptions := []models.NotificationEnum{
		models.NotificationEnumFavoritePerformerScene,
		models.NotificationEnumFavoritePerformerEdit,
		models.NotificationEnumFavoriteStudioScene,
		models.NotificationEnumFavoriteStudioEdit,
	}

	success, err := readRunner.client.updateNotificationSubscriptions(favoriteSubscriptions)
	assert.NoError(s.t, err)
	assert.True(s.t, success, "READ user should be able to subscribe to favorite notification types")

	// Verify subscriptions were actually set
	currentSubscriptions, err := readRunner.getUserNotificationSubscriptions()
	assert.NoError(s.t, err)
	assert.ElementsMatch(s.t, favoriteSubscriptions, currentSubscriptions, "READ user should have all favorite subscriptions set")

	// Test 2: READ user attempts to subscribe to both favorite and non-favorite types
	// Non-favorite types should be silently filtered out
	mixedSubscriptions := []models.NotificationEnum{
		models.NotificationEnumFavoritePerformerScene, // favorite - should be kept
		models.NotificationEnumFavoriteStudioEdit,     // favorite - should be kept
		models.NotificationEnumCommentOwnEdit,         // non-favorite - should be filtered
		models.NotificationEnumDownvoteOwnEdit,        // non-favorite - should be filtered
		models.NotificationEnumUpdatedEdit,            // non-favorite - should be filtered
		models.NotificationEnumCommentCommentedEdit,   // non-favorite - should be filtered
		models.NotificationEnumFingerprintedSceneEdit, // non-favorite - should be filtered
	}

	success, err = readRunner.client.updateNotificationSubscriptions(mixedSubscriptions)
	assert.NoError(s.t, err)
	assert.True(s.t, success, "updateNotificationSubscriptions should succeed for READ user")

	// Verify only favorite subscriptions were set
	currentSubscriptions, err = readRunner.getUserNotificationSubscriptions()
	assert.NoError(s.t, err)
	expectedSubscriptions := []models.NotificationEnum{
		models.NotificationEnumFavoritePerformerScene,
		models.NotificationEnumFavoriteStudioEdit,
	}
	assert.ElementsMatch(s.t, expectedSubscriptions, currentSubscriptions, "READ user should only have favorite subscriptions set")

	// Test 3: EDIT user can subscribe to all notification types including non-favorites
	editRunner := asEdit(s.t)
	allSubscriptions := []models.NotificationEnum{
		models.NotificationEnumFavoritePerformerScene,
		models.NotificationEnumFavoriteStudioEdit,
		models.NotificationEnumCommentOwnEdit,
		models.NotificationEnumDownvoteOwnEdit,
		models.NotificationEnumUpdatedEdit,
		models.NotificationEnumFailedOwnEdit,
		models.NotificationEnumCommentCommentedEdit,
		models.NotificationEnumCommentVotedEdit,
		models.NotificationEnumFingerprintedSceneEdit,
	}

	success, err = editRunner.client.updateNotificationSubscriptions(allSubscriptions)
	assert.NoError(s.t, err)
	assert.True(s.t, success, "EDIT user should be able to subscribe to all notification types")

	// Verify all subscriptions were set
	currentSubscriptions, err = editRunner.getUserNotificationSubscriptions()
	assert.NoError(s.t, err)
	assert.ElementsMatch(s.t, allSubscriptions, currentSubscriptions, "EDIT user should have all subscriptions set")
}

func TestNotificationSubscriptionRoleEnforcement(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testNotificationSubscriptionRoleEnforcement()
}
