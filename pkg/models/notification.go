package models

import "github.com/gofrs/uuid"

type NotificationRepo interface {
	GetNotificationsCount(userID uuid.UUID) (int, error)
	GetUnreadNotificationsCount(userID uuid.UUID) (int, error)
	GetNotifications(filter QueryNotificationsInput, userID uuid.UUID) ([]*Notification, error)
	MarkRead(userID uuid.UUID) error

	TriggerSceneCreationNotifications(sceneID uuid.UUID) error
	TriggerPerformerEditNotifications(editID uuid.UUID) error
	TriggerStudioEditNotifications(editID uuid.UUID) error
	TriggerSceneEditNotifications(editID uuid.UUID) error
	TriggerEditCommentNotifications(editID uuid.UUID) error
	TriggerDownvoteEditNotifications(editID uuid.UUID) error
	TriggerFailedEditNotifications(editID uuid.UUID) error
	TriggerUpdatedEditNotifications(editID uuid.UUID) error
}
