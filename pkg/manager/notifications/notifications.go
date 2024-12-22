//nolint:errcheck
package notifications

import (
	"github.com/stashapp/stash-box/pkg/models"
)

func OnApplyEdit(fac models.Repo, edit *models.Edit) {
	nqb := fac.Notification()
	eqb := fac.Edit()
	if edit.Status == models.VoteStatusEnumAccepted.String() || edit.Status == models.VoteStatusEnumImmediateAccepted.String() && edit.Operation == models.OperationEnumCreate.String() {
		if edit.TargetType == models.TargetTypeEnumScene.String() {
			sceneID, err := eqb.FindSceneID(edit.ID)
			if err != nil || sceneID == nil {
				return
			}

			nqb.TriggerSceneCreationNotifications(*sceneID)
		}
	} else if edit.Status == models.VoteStatusEnumImmediateRejected.String() || edit.Status == models.VoteStatusEnumRejected.String() || edit.Status == models.VoteStatusEnumFailed.String() {
		nqb.TriggerFailedEditNotifications(edit.ID)
	}
}

func OnCancelEdit(fac models.Repo, edit *models.Edit) {
	fac.Notification().TriggerFailedEditNotifications(edit.ID)
}

func OnCreateEdit(fac models.Repo, edit *models.Edit) {
	switch edit.TargetType {
	case models.TargetTypeEnumPerformer.String():
		fac.Notification().TriggerPerformerEditNotifications(edit.ID)
	case models.TargetTypeEnumScene.String():
		fac.Notification().TriggerSceneEditNotifications(edit.ID)
	case models.TargetTypeEnumStudio.String():
		fac.Notification().TriggerStudioEditNotifications(edit.ID)
	}
}

func OnUpdateEdit(fac models.Repo, edit *models.Edit) {
	fac.Notification().TriggerUpdatedEditNotifications(edit.ID)
}

func OnEditDownvote(fac models.Repo, edit *models.Edit) {
	fac.Notification().TriggerDownvoteEditNotifications(edit.ID)
}

func OnEditComment(fac models.Repo, comment *models.EditComment) {
	fac.Notification().TriggerEditCommentNotifications(comment.ID)
}
