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

	ImportRow() ImportRowRepo

	PendingActivation() PendingActivationRepo
	Invite() InviteKeyRepo
	User() UserRepo
}
