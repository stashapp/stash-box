package notification

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/logger"
)

type Notification struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

func NewNotification(queries *db.Queries, withTxn db.WithTxnFunc) *Notification {
	return &Notification{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Notification) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

func (s *Notification) TriggerSceneCreationNotifications(ctx context.Context, sceneID uuid.UUID) error {
	return s.queries.TriggerSceneCreationNotifications(ctx, sceneID)
}

func (s *Notification) TriggerPerformerEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerPerformerEditNotifications(ctx, editID)
}

func (s *Notification) TriggerStudioEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerStudioEditNotifications(ctx, editID)
}

func (s *Notification) TriggerSceneEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerSceneEditNotifications(ctx, editID)
}

func (s *Notification) TriggerEditCommentNotifications(ctx context.Context, commentID uuid.UUID) error {
	return s.queries.TriggerEditCommentNotifications(ctx, commentID)
}

func (s *Notification) TriggerDownvoteEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerDownvoteEditNotifications(ctx, editID)
}

func (s *Notification) TriggerFailedEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerFailedEditNotifications(ctx, editID)
}

func (s *Notification) TriggerUpdatedEditNotifications(ctx context.Context, editID uuid.UUID) error {
	return s.queries.TriggerUpdatedEditNotifications(ctx, editID)
}

func (s *Notification) GetNotificationsCount(ctx context.Context, userID uuid.UUID, unreadOnly bool) (int, error) {
	count, err := s.queries.CountNotificationsByUser(ctx, db.CountNotificationsByUserParams{
		UserID:     userID,
		UnreadOnly: unreadOnly,
	})
	return int(count), err
}

func (s *Notification) GetNotifications(ctx context.Context, userID uuid.UUID, unreadOnly bool) ([]models.Notification, error) {
	var notifications []db.Notification
	var err error

	if unreadOnly {
		notifications, err = s.queries.FindUnreadNotificationsByUser(ctx, userID)
	} else {
		notifications, err = s.queries.FindNotificationsByUser(ctx, userID)
	}

	if err != nil {
		return nil, err
	}
	return converter.NotificationsToModels(notifications), nil
}

// Update methods
func (s *Notification) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.queries.MarkAllNotificationsRead(ctx, userID)
}

func (s *Notification) MarkRead(ctx context.Context, userID uuid.UUID, notificationType models.NotificationEnum, id uuid.UUID) error {
	return s.queries.MarkNotificationRead(ctx, db.MarkNotificationReadParams{
		ID:     id,
		UserID: userID,
		Type:   db.NotificationType(notificationType.String()),
	})
}

// Maintenance methods
func (s *Notification) DestroyExpired(ctx context.Context) error {
	return s.withTxn(func(tx *db.Queries) error {
		return tx.DestroyExpiredNotifications(ctx)
	})
}

func (s *Notification) UpdateNotificationSubscriptions(ctx context.Context, userID uuid.UUID, subscriptions []models.NotificationEnum) error {
	return s.withTxn(func(tx *db.Queries) error {
		if err := tx.DeleteUserNotificationSubscriptions(ctx, userID); err != nil {
			return err
		}

		var params []db.CreateUserNotificationSubscriptionsParams
		for _, sub := range subscriptions {
			params = append(params, db.CreateUserNotificationSubscriptionsParams{
				UserID: userID,
				Type:   db.NotificationType(sub),
			})
		}
		_, err := tx.CreateUserNotificationSubscriptions(ctx, params)
		return err
	})
}

func (s *Notification) OnApplyEdit(ctx context.Context, edit *models.Edit) {
	if (edit.Status == models.VoteStatusEnumAccepted.String() || edit.Status == models.VoteStatusEnumImmediateAccepted.String()) && edit.Operation == models.OperationEnumCreate.String() {
		if edit.TargetType == models.TargetTypeEnumScene.String() && edit.Operation == models.OperationEnumCreate.String() {
			scene, err := s.queries.GetEditTargetID(ctx, edit.ID)
			if err != nil {
				return
			}

			if err := s.TriggerSceneCreationNotifications(ctx, scene.ID); err != nil {
				logger.Errorf("Failed to trigger scene creation notifications: %v", err)
			}
		}
	} else if edit.Status == models.VoteStatusEnumImmediateRejected.String() || edit.Status == models.VoteStatusEnumRejected.String() || edit.Status == models.VoteStatusEnumFailed.String() {
		if err := s.TriggerFailedEditNotifications(ctx, edit.ID); err != nil {
			logger.Errorf("Failed to trigger failed edit notifications: %v", err)
		}
	}
}

func (s *Notification) OnCancelEdit(ctx context.Context, edit *models.Edit) {
	if err := s.TriggerFailedEditNotifications(ctx, edit.ID); err != nil {
		logger.Errorf("Failed to trigger failed edit notifications: %v", err)
	}
}

func (s *Notification) OnCreateEdit(ctx context.Context, edit *models.Edit) {
	switch edit.TargetType {
	case models.TargetTypeEnumPerformer.String():
		if err := s.TriggerPerformerEditNotifications(ctx, edit.ID); err != nil {
			logger.Errorf("Failed to trigger performer edit notifications: %v", err)
		}
	case models.TargetTypeEnumScene.String():
		if err := s.TriggerSceneEditNotifications(ctx, edit.ID); err != nil {
			logger.Errorf("Failed to trigger scene edit notifications: %v", err)
		}
	case models.TargetTypeEnumStudio.String():
		if err := s.TriggerStudioEditNotifications(ctx, edit.ID); err != nil {
			logger.Errorf("Failed to trigger studio edit notifications: %v", err)
		}
	}
}

func (s *Notification) OnUpdateEdit(ctx context.Context, edit *models.Edit) {
	if err := s.TriggerUpdatedEditNotifications(ctx, edit.ID); err != nil {
		logger.Errorf("Failed to trigger updated edit notifications: %v", err)
	}
}

func (s *Notification) OnEditDownvote(ctx context.Context, edit *models.Edit) {
	if err := s.TriggerDownvoteEditNotifications(ctx, edit.ID); err != nil {
		logger.Errorf("Failed to trigger downvote edit notifications: %v", err)
	}
}

func (s *Notification) OnEditComment(ctx context.Context, comment *models.EditComment) {
	if err := s.TriggerEditCommentNotifications(ctx, comment.ID); err != nil {
		logger.Errorf("Failed to trigger edit comment notifications: %v", err)
	}
}
