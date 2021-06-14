package models

import "github.com/stashapp/stash-box/pkg/sqlx"

type repoFactory struct {
	*sqlx.TxnMgr
}

func (f *repoFactory) Image() ImageRepo {
	return newImageQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Performer() PerformerRepo {
	return newPerformerQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Scene() SceneRepo {
	return newSceneQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Studio() StudioRepo {
	return newStudioQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) TagCategory() TagCategoryRepo {
	return newTagCategoryQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Tag() TagRepo {
	return newTagQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Edit() EditRepo {
	return newEditQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Joins() JoinsRepo {
	return newJoinsQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) PendingActivation() PendingActivationRepo {
	return newPendingActivationQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) Invite() InviteKeyRepo {
	return newInviteCodeQueryBuilder(f.TxnMgr)
}

func (f *repoFactory) User() UserRepo {
	return newUserQueryBuilder(f.TxnMgr)
}

type RepoFactoryProvider struct {
	*sqlx.TxnMgr
}

func (p *RepoFactoryProvider) RepoFactory() RepoFactory {
	return &repoFactory{
		p.TxnMgr,
	}
}
