package models

import "github.com/stashapp/stash-box/pkg/txn"

type Repo interface {
	txn.State

	Image() ImageRepo

	Performer() PerformerRepo
	Scene() SceneRepo
	Studio() StudioRepo

	TagCategory() TagCategoryRepo
	Tag() TagRepo

	Edit() EditRepo

	Joins() JoinsRepo

	UserToken() UserTokenRepo
	Invite() InviteKeyRepo
	User() UserRepo
	Site() SiteRepo
	Draft() DraftRepo

	Notification() NotificationRepo
}
