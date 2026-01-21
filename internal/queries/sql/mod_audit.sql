-- name: CreateModAudit :one
INSERT INTO mod_audit (
    id, action, user_id, target_id, target_type, data, reason, created_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
RETURNING *;

-- name: GetModAuditByID :one
SELECT * FROM mod_audit WHERE id = $1;

-- name: GetModAuditByTargetID :many
SELECT * FROM mod_audit WHERE target_id = $1 ORDER BY created_at DESC;

-- name: GetModAuditByUser :many
SELECT * FROM mod_audit
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetModAuditByAction :many
SELECT * FROM mod_audit
WHERE action = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetModAuditCount :one
SELECT COUNT(*) FROM mod_audit
WHERE (sqlc.narg('action')::mod_audit_action IS NULL OR action = sqlc.narg('action'))
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'));

-- name: QueryModAudits :many
SELECT * FROM mod_audit
WHERE (sqlc.narg('action')::mod_audit_action IS NULL OR action = sqlc.narg('action'))
  AND (sqlc.narg('user_id')::uuid IS NULL OR user_id = sqlc.narg('user_id'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: DeleteExpiredModAudits :exec
DELETE FROM mod_audit
WHERE created_at < NOW() - INTERVAL '1 day' * $1;
