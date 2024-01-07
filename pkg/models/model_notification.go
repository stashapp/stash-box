package models

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
)

type NotificationEnum string

const (
	NotificationEnumFavoritePerformerScene NotificationEnum = "FAVORITE_PERFORMER_SCENE"
	NotificationEnumFavoritePerformerEdit  NotificationEnum = "FAVORITE_PERFORMER_EDIT"
	NotificationEnumFavoriteStudioScene    NotificationEnum = "FAVORITE_STUDIO_SCENE"
	NotificationEnumFavoriteStudioEdit     NotificationEnum = "FAVORITE_STUDIO_EDIT"
	NotificationEnumCommentOwnEdit         NotificationEnum = "COMMENT_OWN_EDIT"
	NotificationEnumDownvoteOwnEdit        NotificationEnum = "DOWNVOTE_OWN_EDIT"
	NotificationEnumFailedOwnEdit          NotificationEnum = "FAILED_OWN_EDIT"
	NotificationEnumCommentCommentedEdit   NotificationEnum = "COMMENT_COMMENTED_EDIT"
	NotificationEnumCommentVotedEdit       NotificationEnum = "COMMENT_VOTED_EDIT"
	NotificationEnumUpdatedEdit            NotificationEnum = "UPDATED_EDIT"
)

type Notification struct {
	UserID    uuid.UUID        `db:"user_id" json:"user_id"`
	Type      NotificationEnum `db:"type" json:"type"`
	TargetID  uuid.UUID        `db:"id" json:"id"`
	CreatedAt time.Time        `db:"created_at" json:"created_at"`
	ReadAt    sql.NullTime     `db:"read_at" json:"read_at"`
}

type Notifications []*Notification

func (s Notifications) Each(fn func(interface{})) {
	for _, v := range s {
		fn(v)
	}
}

func (s *Notifications) Add(o interface{}) {
	*s = append(*s, o.(*Notification))
}

type QueryNotificationsResult struct {
	Input QueryNotificationsInput
}
