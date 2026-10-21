-- name: LockFingerprintReportScene :one
-- Serialize report creation with fingerprint moves from the same scene.
SELECT id FROM scenes WHERE id = $1 AND NOT deleted FOR UPDATE;

-- name: CreateFingerprintReport :one
INSERT INTO fingerprint_reports (hash, algorithm, scene_id, correct_scene_id, user_id, comment)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (scene_id, hash, algorithm, user_id) WHERE status = 'OPEN'
DO UPDATE SET
    correct_scene_id = COALESCE(EXCLUDED.correct_scene_id, fingerprint_reports.correct_scene_id),
    comment = COALESCE(EXCLUDED.comment, fingerprint_reports.comment)
RETURNING *;

-- name: FindFingerprintReports :many
SELECT * FROM fingerprint_reports
WHERE (sqlc.narg(status)::text IS NULL OR status = sqlc.narg(status))
  AND (sqlc.narg(scene_id)::uuid IS NULL OR scene_id = sqlc.narg(scene_id))
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg(page_size)::int OFFSET sqlc.arg(page_offset)::int;

-- name: CountFingerprintReports :one
SELECT COUNT(*) FROM fingerprint_reports
WHERE (sqlc.narg(status)::text IS NULL OR status = sqlc.narg(status))
  AND (sqlc.narg(scene_id)::uuid IS NULL OR scene_id = sqlc.narg(scene_id));

-- name: CloseFingerprintReport :one
UPDATE fingerprint_reports SET status = 'INCORRECT', resolved_at = CURRENT_TIMESTAMP, resolved_by = $2
WHERE id = $1 AND status = 'OPEN'
RETURNING *;

-- name: CompleteFingerprintReports :exec
UPDATE fingerprint_reports SET status = 'COMPLETED', resolved_at = CURRENT_TIMESTAMP, resolved_by = sqlc.arg(user_id)
WHERE scene_id = sqlc.arg(scene_id) AND hash = sqlc.arg(hash) AND algorithm = sqlc.arg(algorithm) AND status = 'OPEN';

-- name: PurgeFingerprintReports :exec
DELETE FROM fingerprint_reports WHERE resolved_at <= CURRENT_TIMESTAMP - INTERVAL '24 hours';
