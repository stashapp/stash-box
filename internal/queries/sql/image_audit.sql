-- Image audit queries

-- name: CreateImageAudit :one
INSERT INTO image_audit (id, action, user_id, image_id, data, created_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING *;

-- name: GetImageAudits :many
-- One image's trail, newest first. The optional action narrowing is what
-- the revert uses to find the categorization state to restore.
SELECT * FROM image_audit
WHERE image_id = $1
  AND (sqlc.narg('action')::text IS NULL OR action = sqlc.narg('action'))
ORDER BY created_at DESC, id DESC;

-- name: DeleteExpiredImageAudits :exec
DELETE FROM image_audit
WHERE created_at < NOW() - INTERVAL '1 day' * $1;
