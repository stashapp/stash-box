//nolint:errcheck
package notifications

import (
	"context"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/sqlx"
)

var rfp *sqlx.TxnMgr

func Init(txnMgr *sqlx.TxnMgr) {
	rfp = txnMgr
}

func OnApplyEdit(edit *models.Edit) {
	fac := rfp.Repo(context.Background())
	nqb := fac.Notification()
	eqb := fac.Edit()
	if (edit.Status == models.VoteStatusEnumAccepted.String() || edit.Status == models.VoteStatusEnumImmediateAccepted.String()) && edit.Operation == models.OperationEnumCreate.String() {
		if edit.TargetType == models.TargetTypeEnumScene.String() && edit.Operation == models.OperationEnumCreate.String() {
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

func OnCancelEdit(edit *models.Edit) {
	fac := rfp.Repo(context.Background())
	fac.Notification().TriggerFailedEditNotifications(edit.ID)
}

func OnCreateEdit(edit *models.Edit) {
	fac := rfp.Repo(context.Background())
	switch edit.TargetType {
	case models.TargetTypeEnumPerformer.String():
		fac.Notification().TriggerPerformerEditNotifications(edit.ID)
	case models.TargetTypeEnumScene.String():
		fac.Notification().TriggerSceneEditNotifications(edit.ID)
	case models.TargetTypeEnumStudio.String():
		fac.Notification().TriggerStudioEditNotifications(edit.ID)
	}
}

func OnUpdateEdit(edit *models.Edit) {
	fac := rfp.Repo(context.Background())
	fac.Notification().TriggerUpdatedEditNotifications(edit.ID)
}

func OnEditDownvote(edit *models.Edit) {
	fac := rfp.Repo(context.Background())
	fac.Notification().TriggerDownvoteEditNotifications(edit.ID)
}

func OnEditComment(comment *models.EditComment) {
	fac := rfp.Repo(context.Background())
	fac.Notification().TriggerEditCommentNotifications(comment.ID)
}

var defaultSubscriptions = []models.NotificationEnum{
	models.NotificationEnumCommentOwnEdit,
	models.NotificationEnumDownvoteOwnEdit,
	models.NotificationEnumFailedOwnEdit,
	models.NotificationEnumCommentCommentedEdit,
	models.NotificationEnumCommentVotedEdit,
	models.NotificationEnumUpdatedEdit,
}

func GetDefaultSubscriptions() []models.NotificationEnum {
	return defaultSubscriptions
}
