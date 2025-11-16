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

// testNotificationOnFailedOwnEdit tests that a notification is created when the user's edit fails
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

	// Cancel the edit (which should trigger a failed edit notification)
	_, err = s.resolver.Mutation().CancelEdit(s.ctx, models.CancelEditInput{
		ID: createdEdit.ID,
	})
	assert.NoError(s.t, err)

	// Small delay to ensure notification is created
	time.Sleep(100 * time.Millisecond)

	// Verify unread count increased
	newUnreadCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.True(s.t, newUnreadCount > initialUnreadCount, "Unread count should have increased after edit cancellation")

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

func TestMarkSpecificNotificationRead(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testMarkSpecificNotificationRead()
}

func TestMarkAllNotificationsRead(t *testing.T) {
	pt := createNotificationTestRunner(t)
	pt.testMarkAllNotificationsRead()
}
