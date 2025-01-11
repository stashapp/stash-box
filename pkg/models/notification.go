package models

import "github.com/gofrs/uuid"

type NotificationRepo interface {
	GetNotifications(userID uuid.UUID, filter QueryNotificationsInput) ([]*Notification, error)
	GetNotificationsCount(userID uuid.UUID, filter QueryNotificationsInput) (int, error)
	MarkRead(userID uuid.UUID, notificationType NotificationEnum, id uuid.UUID) error
	MarkAllRead(userID uuid.UUID) error

	TriggerSceneCreationNotifications(sceneID uuid.UUID) error
	TriggerPerformerEditNotifications(editID uuid.UUID) error
	TriggerStudioEditNotifications(editID uuid.UUID) error
	TriggerSceneEditNotifications(editID uuid.UUID) error
	TriggerEditCommentNotifications(editID uuid.UUID) error
	TriggerDownvoteEditNotifications(editID uuid.UUID) error
	TriggerFailedEditNotifications(editID uuid.UUID) error
	TriggerUpdatedEditNotifications(editID uuid.UUID) error
}
