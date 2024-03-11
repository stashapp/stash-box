package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	notificationTable = "notifications"
)

var (
	notificationDBTable = newTable(notificationTable, func() interface{} {
		return &models.Notification{}
	})
)

type notificationsQueryBuilder struct {
	dbi *dbi
}

func newNotificationQueryBuilder(txn *txnState) models.NotificationRepo {
	return &notificationsQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *notificationsQueryBuilder) TriggerSceneCreationNotifications(sceneID uuid.UUID) error {
	var args []interface{}
	args = append(args, sceneID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM scenes S JOIN studio_favorites SF ON S.studio_id = SF.studio_id
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_SCENE'
		WHERE S.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM scene_performers SP JOIN performer_favorites PF ON SP.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_SCENE'
		WHERE SP.scene_id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerPerformerEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM performer_edits PE JOIN performer_favorites PF ON PE.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT'
		WHERE PE.edit_id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerStudioEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM studio_edits SE
		JOIN studio_favorites SF ON SE.studio_id = SF.studio_id
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT'
		WHERE SE.edit_id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerSceneEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications 
		SELECT N.user_id, N.type, $1
		FROM edits E JOIN studio_favorites SF ON (E.data->'new_data'->>'studio_id')::uuid = SF.studio_id
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT'
		WHERE E.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM (
				SELECT id, (jsonb_array_elements(edits.data->'new_data'->'added_performers')->>'performer_id')::uuid AS performer_id FROM edits
		) E JOIN performer_favorites PF ON E.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT'
		WHERE E.id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerEditCommentNotifications(commentID uuid.UUID) error {
	var args []interface{}
	args = append(args, commentID)
	query := `
INSERT INTO notifications 
		SELECT N.user_id, N.type, $1
		FROM edit_comments EC
		JOIN edits E ON EC.edit_id = E.id
		JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'COMMENT_OWN_EDIT'
		WHERE EC.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM edit_comments EC
		JOIN edits E ON EC.edit_id = E.id JOIN edit_comments EO ON EO.edit_id = E.id
		JOIN user_notifications N ON EO.user_id = N.user_id AND N.type = 'COMMENT_COMMENTED_EDIT'
		WHERE EO.user_id != E.user_id AND EO.user_id != EC.user_id AND EC.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM edit_comments EC
		JOIN edits E ON EC.edit_id = E.id JOIN edit_votes EV ON EV.edit_id = E.id
		JOIN user_notifications N ON EV.user_id = N.user_id AND N.type = 'COMMENT_VOTED_EDIT'
		WHERE EV.vote != 'ABSTAIN' AND EV.user_id != E.user_id AND EV.user_id != EC.user_id AND EC.id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerDownvoteEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM edits E
		JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'DOWNVOTE_OWN_EDIT'
		WHERE E.id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerFailedEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM edits E
		JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'FAILED_OWN_EDIT'
		WHERE E.id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) TriggerUpdatedEditNotifications(editID uuid.UUID) error {
	var args []interface{}
	args = append(args, editID)
	query := `
INSERT INTO notifications
		SELECT N.user_id, N.type, $1
		FROM edits E
		JOIN edit_votes EV ON E.id = EV.edit_id
		JOIN user_notifications N ON EV.user_id = N.user_id AND N.type = 'UPDATED_EDIT'
		WHERE E.id = $1
	`
	err := qb.dbi.RawExec(query, args)
	return err
}

func (qb *notificationsQueryBuilder) GetUnreadNotificationsCount(userID uuid.UUID) (int, error) {
	var args []interface{}
	args = append(args, userID)
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL"), args)
}

func (qb *notificationsQueryBuilder) GetNotificationsCount(userID uuid.UUID) (int, error) {
	var args []interface{}
	args = append(args, userID)
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT * FROM notifications WHERE user_id = ?"), args)
}

func (qb *notificationsQueryBuilder) GetNotifications(filter models.QueryNotificationsInput, userID uuid.UUID) ([]*models.Notification, error) {
	query := newQueryBuilder(notificationDBTable)
	query.Eq("user_id", userID)
	query.Pagination = getPagination(filter.Page, filter.PerPage)
	query.Sort = getSort("created_at", models.SortDirectionEnumDesc.String(), notificationDBTable.name, nil)

	var notifications models.Notifications
	_, err := qb.dbi.Query(*query, &notifications)

	if err != nil {
		return nil, err
	}

	return notifications, nil
}
