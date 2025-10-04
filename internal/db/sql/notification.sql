-- Notification queries

-- name: FindNotificationsByUser :many
SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;

-- name: FindUnreadNotificationsByUser :many
SELECT * FROM notifications WHERE user_id = $1 AND read_at IS NULL ORDER BY created_at DESC;

-- name: CountNotificationsByUser :one
SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND (sqlc.arg(unread_only)::boolean = FALSE OR read_at IS NULL);

-- name: MarkAllNotificationsRead :exec
UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL;

-- name: MarkNotificationRead :exec
UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND type = $2 AND id = $3 AND read_at IS NULL;

-- User notification subscriptions

-- name: CreateUserNotificationSubscriptions :copyfrom
INSERT INTO user_notifications (user_id, type) VALUES ($1, $2);

-- name: DeleteUserNotificationSubscriptions :exec
DELETE FROM user_notifications WHERE user_id = $1;

-- name: DestroyExpiredNotifications :exec
DELETE FROM notifications
WHERE read_at < CURRENT_DATE - INTERVAL '1 day'
   OR created_at < CURRENT_DATE - INTERVAL '14 day';

-- name: TriggerSceneCreationNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1 as id
FROM scenes S
JOIN scene_edits SE ON S.id = SE.scene_id
JOIN edits E ON SE.edit_id = E.id AND E.operation = 'CREATE'
JOIN studio_favorites SF ON S.studio_id = SF.studio_id
JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_SCENE' AND E.user_id != N.user_id
WHERE S.id = $1
UNION
SELECT N.user_id, N.type, $1 as id
FROM scene_performers SP
JOIN scene_edits SE ON SP.scene_id = SE.scene_id
JOIN edits E ON SE.edit_id = E.id AND E.operation = 'CREATE'
JOIN performer_favorites PF ON SP.performer_id = PF.performer_id
JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_SCENE' AND E.user_id != N.user_id
WHERE SP.scene_id = $1;

-- name: TriggerPerformerEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1
FROM performer_edits PE
JOIN edits E ON PE.edit_id = E.id
JOIN performer_favorites PF ON PE.performer_id = PF.performer_id
JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT' AND N.user_id != E.user_id
WHERE PE.edit_id = $1;

-- name: TriggerStudioEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1
FROM studio_edits SE
JOIN edits E ON SE.edit_id = E.id
JOIN studio_favorites SF ON SE.studio_id = SF.studio_id
JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT' AND N.user_id != E.user_id
WHERE SE.edit_id = $1;

-- name: TriggerDownvoteEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1
FROM edits E
JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'DOWNVOTE_OWN_EDIT'
WHERE E.id = $1;

-- name: TriggerFailedEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1
FROM edits E
JOIN user_notifications N ON E.user_id = N.user_id AND N.type = 'FAILED_OWN_EDIT'
WHERE E.id = $1;

-- name: TriggerUpdatedEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT N.user_id, N.type, $1
FROM edits E
JOIN edit_votes EV ON E.id = EV.edit_id
JOIN user_notifications N ON EV.user_id = N.user_id AND N.type = 'UPDATED_EDIT'
WHERE E.id = $1;

-- name: TriggerSceneEditNotifications :exec
INSERT INTO notifications (user_id, type, id)
SELECT DISTINCT ON (user_id) user_id, type, $1 FROM (
    SELECT N.user_id, N.type
    FROM edits E JOIN studio_favorites SF ON (E.data->'new_data'->>'studio_id')::uuid = SF.studio_id
    JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT' AND N.user_id != E.user_id
    WHERE E.id = $1
    UNION
    SELECT N.user_id, N.type
    FROM edits E
    JOIN scene_edits SE ON E.id = SE.edit_id
    JOIN scenes S ON SE.scene_id = S.id
    JOIN studio_favorites SF ON S.studio_id = SF.studio_id
    JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FAVORITE_STUDIO_EDIT' AND N.user_id != E.user_id
    WHERE E.id = $1
    UNION
    SELECT N.user_id, N.type
    FROM (
        SELECT id, (jsonb_array_elements(edits.data->'new_data'->'added_performers')->>'performer_id')::uuid AS performer_id, user_id
        FROM edits
    ) E JOIN performer_favorites PF ON E.performer_id = PF.performer_id
    JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT' AND N.user_id != E.user_id
    WHERE E.id = $1
    UNION
    SELECT N.user_id, N.type
    FROM edits E
    JOIN scene_edits SE ON E.id = SE.edit_id
    JOIN scene_performers SP ON SP.scene_id = SE.scene_id
    JOIN performer_favorites PF ON PF.performer_id = SP.performer_id
    JOIN user_notifications N ON PF.user_id = N.user_id AND N.type = 'FAVORITE_PERFORMER_EDIT' AND N.user_id != E.user_id
    WHERE E.id = $1
    UNION
    SELECT N.user_id, N.type
    FROM edits E
    JOIN scene_edits SE ON E.id = SE.edit_id
    JOIN scene_fingerprints SF ON SE.scene_id = SF.scene_id
    JOIN user_notifications N ON SF.user_id = N.user_id AND N.type = 'FINGERPRINTED_SCENE_EDIT' AND N.user_id != E.user_id
    WHERE E.id = $1
) notifications;

-- name: TriggerEditCommentNotifications :exec
INSERT INTO notifications (user_id, type, id)
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
ORDER BY user_id, ordering ASC;
