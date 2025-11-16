package models

import (
	"time"

	"github.com/gofrs/uuid"
)

type Notification struct {
	UserID    uuid.UUID        `json:"user_id"`
	Type      NotificationEnum `json:"type"`
	TargetID  uuid.UUID        `json:"id"`
	CreatedAt time.Time        `json:"created_at"`
	ReadAt    *time.Time       `json:"read_at"`
}

type QueryNotificationsResult struct {
	Input QueryNotificationsInput
}

var defaultSubscriptions = []NotificationEnum{
	NotificationEnumCommentOwnEdit,
	NotificationEnumDownvoteOwnEdit,
	NotificationEnumFailedOwnEdit,
	NotificationEnumCommentCommentedEdit,
	NotificationEnumCommentVotedEdit,
	NotificationEnumUpdatedEdit,
}

func GetDefaultNotificationSubscriptions() []NotificationEnum {
	return defaultSubscriptions
}
