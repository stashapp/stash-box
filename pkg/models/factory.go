package models

import "github.com/stashapp/stash-box/pkg/txn"

type RepoFactory interface {
	txn.State

	Image() ImageRepo

	Performer() PerformerRepo
	Scene() SceneRepo
	Studio() StudioRepo

	TagCategory() TagCategoryRepo
	Tag() TagRepo

	Edit() EditRepo

	Joins() JoinsRepo

	PendingActivation() PendingActivationRepo
	Invite() InviteKeyRepo
	User() UserRepo
}
