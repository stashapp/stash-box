//go:build integration

package api_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/service/notification"
	"github.com/stretchr/testify/assert"
)

type mentionTestRunner struct {
	testRunner
}

func createMentionTestRunner(t *testing.T) *mentionTestRunner {
	return &mentionTestRunner{testRunner: *asEdit(t)}
}

// switchUser returns a context whose currentUser is the supplied user with the
// given roles, for invoking resolvers as that user.
func switchUser(base context.Context, u *models.User, roles []models.RoleEnum) context.Context {
	ctx := context.WithValue(base, auth.ContextUser, auth.FromUser(u))
	ctx = context.WithValue(ctx, auth.ContextRoles, roles)
	return ctx
}

// commentBody fetches the first comment's text for an edit.
func (s *mentionTestRunner) commentBody(edit *models.Edit) (string, error) {
	comments, err := s.resolver.Edit().Comments(s.ctx, edit)
	if err != nil {
		return "", err
	}
	if len(comments) == 0 {
		return "", nil
	}
	return comments[0].Text, nil
}

// testMentionNormalizedToUUID checks that a bare @<name> in a posted comment
// is rewritten to @<uuid> in storage, and that the quoted @"<name>" form
// works for names containing spaces.
func (s *mentionTestRunner) testMentionNormalizedToUUID() {
	editRoles := []models.RoleEnum{models.RoleEnumEdit}

	// Bare name (no spaces).
	bare, err := s.createTestUser(nil, editRoles)
	assert.NoError(s.t, err)

	// Quoted name (with spaces).
	quotedName := "Alice " + s.generateUserName()
	quoted, err := s.createTestUser(&models.UserCreateInput{
		Name:     quotedName,
		Email:    strings.ReplaceAll(quotedName, " ", ".") + "@example.com",
		Password: "Password!" + quotedName,
		Roles:    editRoles,
	}, editRoles)
	assert.NoError(s.t, err)
	if quoted == nil {
		return
	}

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	body := "hey @" + bare.Name + ` and @"` + quoted.Name + `" please review`
	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: body,
	})
	assert.NoError(s.t, err)

	stored, err := s.commentBody(edit)
	assert.NoError(s.t, err)
	assert.Contains(s.t, stored, "@"+bare.ID.String(), "bare @name should be normalized to @<uuid>")
	assert.Contains(s.t, stored, "@"+quoted.ID.String(), "quoted @\"name\" should be normalized to @<uuid>")
	assert.NotContains(s.t, stored, "@"+bare.Name, "raw @name should not appear after normalization")
	assert.NotContains(s.t, stored, `@"`+quoted.Name+`"`, "raw @\"name\" should not appear after normalization")
}

// testMentionUnknownNameKept ensures names that don't match any user are left
// alone in the persisted body.
func (s *mentionTestRunner) testMentionUnknownNameKept() {
	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	body := "hello @nobody_ever_called_this nothing happens"
	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: body,
	})
	assert.NoError(s.t, err)

	stored, err := s.commentBody(edit)
	assert.NoError(s.t, err)
	assert.Equal(s.t, body, stored, "unmatched names should remain untouched")
}

// testMentionTriggersNotification checks that mentioning a user with EDIT
// role produces a notification. MENTIONED is always on for editors and isn't
// user-subscribable, so no setup is needed beyond having the EDIT role.
func (s *mentionTestRunner) testMentionTriggersNotification() {
	editRoles := []models.RoleEnum{models.RoleEnumEdit}
	mentionee, err := s.createTestUser(nil, editRoles)
	assert.NoError(s.t, err)

	menteeRunner := createTestRunner(s.t, mentionee, editRoles)
	beforeCount, err := menteeRunner.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: "ping @" + mentionee.Name,
	})
	assert.NoError(s.t, err)

	stored, err := s.commentBody(edit)
	assert.NoError(s.t, err)
	assert.Contains(s.t, stored, "@"+mentionee.ID.String(), "comment body should reference the mentionee by UUID")

	// OnEditComment fires off the notification trigger in a goroutine; mirror
	// the wait pattern used by the other notification tests.
	time.Sleep(250 * time.Millisecond)

	afterCount, err := menteeRunner.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.Greater(s.t, afterCount, beforeCount, "mentionee should receive a MENTIONED notification")

	result, err := menteeRunner.client.queryNotifications(models.QueryNotificationsInput{
		Page:       1,
		PerPage:    25,
		UnreadOnly: pointerTo(true),
		Type:       func() *models.NotificationEnum { t := models.NotificationEnumMentioned; return &t }(),
	})
	assert.NoError(s.t, err)
	assert.NotEmpty(s.t, result.Notifications, "should have an unread MENTIONED notification")
}

// testMentionDoesNotNotifyAuthor ensures the comment author isn't notified
// when they mention themselves.
func (s *mentionTestRunner) testMentionDoesNotNotifyAuthor() {
	beforeCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: "talking to myself @" + userDB.edit.Name,
	})
	assert.NoError(s.t, err)

	time.Sleep(150 * time.Millisecond)

	afterCount, err := s.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	// The CommentOwnEdit notification doesn't fire either (the author owns the
	// edit), so the unread count for the author should not move.
	assert.Equal(s.t, beforeCount, afterCount, "author should not be notified when they self-mention")
}

// testMentionSkipsNonEditUser ensures a mention of a user without the EDIT
// role doesn't produce a notification, even if their name resolves and they
// would otherwise be subscribed.
func (s *mentionTestRunner) testMentionSkipsNonEditUser() {
	readRoles := []models.RoleEnum{models.RoleEnumRead}
	reader, err := s.createTestUser(nil, readRoles)
	assert.NoError(s.t, err)

	// The reader can't actually subscribe to MENTIONED (role-gated), but the
	// notification trigger also filters by role, which is what we're testing.
	readerRunner := createTestRunner(s.t, reader, readRoles)
	beforeCount, err := readerRunner.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: "hello @" + reader.Name,
	})
	assert.NoError(s.t, err)

	time.Sleep(150 * time.Millisecond)

	afterCount, err := readerRunner.client.getUnreadNotificationCount()
	assert.NoError(s.t, err)
	assert.Equal(s.t, beforeCount, afterCount, "READ-only user should not receive MENTIONED notification")

	// And the body still contains the resolved UUID — the role filter is at the
	// notification trigger, not at normalization time.
	stored, err := s.commentBody(edit)
	assert.NoError(s.t, err)
	assert.Contains(s.t, stored, "@"+reader.ID.String())
}

func TestMentionNormalizedToUUID(t *testing.T) {
	createMentionTestRunner(t).testMentionNormalizedToUUID()
}

func TestMentionUnknownNameKept(t *testing.T) {
	createMentionTestRunner(t).testMentionUnknownNameKept()
}

func TestMentionTriggersNotification(t *testing.T) {
	createMentionTestRunner(t).testMentionTriggersNotification()
}

func TestMentionDoesNotNotifyAuthor(t *testing.T) {
	createMentionTestRunner(t).testMentionDoesNotNotifyAuthor()
}

func TestMentionSkipsNonEditUser(t *testing.T) {
	createMentionTestRunner(t).testMentionSkipsNonEditUser()
}

// testMentionCapStopsAtFour mentions five distinct users in one comment and
// verifies only the first MaxMentions are rewritten to @<uuid>; the rest
// remain as @<name> plain text.
func (s *mentionTestRunner) testMentionCapStopsAtFour() {
	editRoles := []models.RoleEnum{models.RoleEnumEdit}
	extra := notification.MaxMentions + 1
	users := make([]*models.User, 0, extra)
	for i := 0; i < extra; i++ {
		u, err := s.createTestUser(nil, editRoles)
		assert.NoError(s.t, err)
		if u == nil {
			return
		}
		users = append(users, u)
	}

	var parts []string
	for _, u := range users {
		parts = append(parts, "@"+u.Name)
	}
	body := "team: " + strings.Join(parts, " ")

	edit, err := s.createTestTagEdit(models.OperationEnumCreate, nil, nil)
	assert.NoError(s.t, err)

	_, err = s.resolver.Mutation().EditComment(s.ctx, models.EditCommentInput{
		ID:      edit.ID,
		Comment: body,
	})
	assert.NoError(s.t, err)

	stored, err := s.commentBody(edit)
	assert.NoError(s.t, err)

	for i, u := range users {
		if i < notification.MaxMentions {
			assert.Contains(s.t, stored, "@"+u.ID.String(),
				"user %d should be normalized to @<uuid>", i)
			assert.NotContains(s.t, stored, "@"+u.Name,
				"raw @%s should not survive normalization", u.Name)
		} else {
			assert.Contains(s.t, stored, "@"+u.Name,
				"user %d past the cap should remain as @<name>", i)
			assert.NotContains(s.t, stored, "@"+u.ID.String(),
				"user %d past the cap should not be linked to a UUID", i)
		}
	}
}

func TestMentionCapStopsAtFour(t *testing.T) {
	createMentionTestRunner(t).testMentionCapStopsAtFour()
}
