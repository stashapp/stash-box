package sqlx

import (
	"github.com/stashapp/stash-box/pkg/models"
)

type repo struct {
	*txnState
}

func (f *repo) Image() models.ImageRepo {
	return newImageQueryBuilder(f.txnState)
}

func (f *repo) Performer() models.PerformerRepo {
	return newPerformerQueryBuilder(f.txnState)
}

func (f *repo) Scene() models.SceneRepo {
	return newSceneQueryBuilder(f.txnState)
}

func (f *repo) Studio() models.StudioRepo {
	return newStudioQueryBuilder(f.txnState)
}

func (f *repo) TagCategory() models.TagCategoryRepo {
	return newTagCategoryQueryBuilder(f.txnState)
}

func (f *repo) Tag() models.TagRepo {
	return newTagQueryBuilder(f.txnState)
}

func (f *repo) Edit() models.EditRepo {
	return newEditQueryBuilder(f.txnState)
}

func (f *repo) Joins() models.JoinsRepo {
	return newJoinsQueryBuilder(f.txnState)
}

func (f *repo) PendingActivation() models.PendingActivationRepo {
	return newPendingActivationQueryBuilder(f.txnState)
}

func (f *repo) Invite() models.InviteKeyRepo {
	return newInviteCodeQueryBuilder(f.txnState)
}

func (f *repo) User() models.UserRepo {
	return newUserQueryBuilder(f.txnState)
}

func (f *repo) Site() models.SiteRepo {
	return newSiteQueryBuilder(f.txnState)
}
