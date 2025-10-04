-- Draft queries

-- name: CreateDraft :one
INSERT INTO drafts (id, user_id, type, data, created_at)
VALUES ($1, $2, $3, $4, now())
RETURNING *;

-- name: DeleteDraft :exec
DELETE FROM drafts WHERE id = $1;

-- name: FindDraft :one
SELECT * FROM drafts WHERE id = $1;

-- name: FindDraftsByUser :many
SELECT * FROM drafts WHERE user_id = $1;

-- name: FindExpiredDrafts :many
SELECT * FROM drafts WHERE created_at <= (now()::timestamp - (INTERVAL '1 second' * $1));

-- name: DeleteExpiredDrafts :exec
DELETE FROM drafts WHERE created_at <= (now()::timestamp - (INTERVAL '1 second' * $1));
