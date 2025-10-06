package gen

import (
	"time"

	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
)

// Extend functions for type conversions

func ConvertTime(t time.Time) time.Time {
	return t
}

func ConvertNullIntToInt(i *int) int {
	if i != nil {
		return *i
	}
	return 0
}

func ConvertNotificationType(t db.NotificationType) models.NotificationEnum {
	return models.NotificationEnum(t)
}
