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
		FROM scenes S
		JOIN scene_edits SE ON S.id = SE.scene_id
		JOIN edits E ON SE.edit_id = E.id AND E.operation = 'CREATE'
		JOIN studio_favorites SF ON S.studio_id = SF.studio_id
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_SCENE' AND E.user_id != N.user_id
		WHERE S.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM scene_performers SP
		JOIN scene_edits SE ON SP.scene_id = SE.scene_id
		JOIN edits E ON SE.edit_id = E.id AND E.operation = 'CREATE'
		JOIN performer_favorites PF ON SP.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_SCENE' AND E.user_id != N.user_id
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
		FROM performer_edits PE
		JOIN edits E ON PE.edit_id = E.id
		JOIN performer_favorites PF ON PE.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT' AND N.user_id != E.user_id
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
		JOIN edits E ON SE.edit_id = E.id
		JOIN studio_favorites SF ON SE.studio_id = SF.studio_id
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT' AND N.user_id != E.user_id
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
		JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT' AND N.user_id != E.user_id
		WHERE E.id = $1
		UNION
		SELECT N.user_id, N.type, $1
		FROM (
				SELECT id, (jsonb_array_elements(edits.data->'new_data'->'added_performers')->>'performer_id')::uuid AS performer_id, user_id
				FROM edits
		) E JOIN performer_favorites PF ON E.performer_id = PF.performer_id
		JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT' AND N.user_id != E.user_id
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
    SELECT DISTINCT ON (user_id) user_id, type, $1 FROM (
			SELECT N.user_id, N.type, 1 as ordering
			FROM edit_comments EC
			JOIN edits E ON EC.edit_id = E.id
			JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'COMMENT_OWN_EDIT'
			WHERE E.user_id != EC.user_id
			AND EC.id = $1
			UNION
			SELECT N.user_id, N.type, 2 as ordering
			FROM edit_comments EC
			JOIN edits E ON EC.edit_id = E.id
			JOIN edit_comments EO ON EO.edit_id = E.id
			JOIN user_notifications N ON EO.user_id = N.user_id AND N.type = 'COMMENT_COMMENTED_EDIT'
			WHERE EO.user_id != E.user_id
			AND EO.user_id != EC.user_id
			AND EC.id = $1
			UNION
			SELECT N.user_id, N.type, 3 as ordering
			FROM edit_comments EC
			JOIN edits E ON EC.edit_id = E.id
			JOIN edit_votes EV ON EV.edit_id = E.id
			JOIN user_notifications N ON EV.user_id = N.user_id AND N.type = 'COMMENT_VOTED_EDIT'
			WHERE EV.vote != 'ABSTAIN'
			AND EV.user_id != E.user_id
			AND EV.user_id != EC.user_id
			AND EC.id = $1
		) notifications
		ORDER BY user_id, ordering ASC
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

func (qb *notificationsQueryBuilder) GetNotificationsCount(userID uuid.UUID, filter models.QueryNotificationsInput) (int, error) {
	query := buildQuery(userID, filter)
	return qb.dbi.CountOnly(*query)
}

func (qb *notificationsQueryBuilder) GetNotifications(userID uuid.UUID, filter models.QueryNotificationsInput) ([]*models.Notification, error) {
	query := buildQuery(userID, filter)
	query.Pagination = getPagination(filter.Page, filter.PerPage)
	query.Sort = getSort("created_at", models.SortDirectionEnumDesc.String(), notificationDBTable.name, nil)

	var notifications models.Notifications
	_, err := qb.dbi.Query(*query, &notifications)

	if err != nil {
		return nil, err
	}

	return notifications, nil
}

func (qb *notificationsQueryBuilder) MarkRead(userID uuid.UUID) error {
	args := []interface{}{userID}
	return qb.dbi.RawExec("UPDATE notifications SET read_at = now() WHERE user_id = ? AND read_at IS NULL", args)
}

func buildQuery(userID uuid.UUID, filter models.QueryNotificationsInput) *queryBuilder {
	query := newQueryBuilder(notificationDBTable)

	query.AddWhere("user_id = ?")
	query.AddArg(userID)

	if filter.UnreadOnly != nil && *filter.UnreadOnly {
		query.AddWhere("read_at IS NULL")
	}

	if filter.Type != nil {
		query.AddWhere("type = ?")
		query.AddArg(filter.Type.String())
	}

	return query
}
