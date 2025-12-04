-- Fingerprint queries (normalized schema)

-- name: CreateFingerprint :one
INSERT INTO fingerprints (hash, algorithm) VALUES ($1, $2)
ON CONFLICT (hash, algorithm) DO UPDATE SET hash = EXCLUDED.hash
RETURNING *;

-- name: GetFingerprint :one
SELECT * FROM fingerprints WHERE hash = $1 AND algorithm = $2;

-- name: SubmittedHashExists :one
SELECT EXISTS(
		SELECT
			1
		FROM scene_fingerprints f
		JOIN fingerprints fp ON f.fingerprint_id = fp.id
		WHERE f.scene_id = $1 AND fp.hash = $2 AND fp.algorithm = $3 AND f.vote = 1
) AS exists;

-- name: CreateSceneFingerprints :copyfrom
INSERT INTO scene_fingerprints (fingerprint_id, scene_id, user_id, duration) VALUES ($1, $2, $3, $4);

-- name: CreateOrReplaceFingerprint :exec
INSERT INTO scene_fingerprints (fingerprint_id, scene_id, user_id, duration, vote)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT ON CONSTRAINT scene_fingerprints_scene_id_fingerprint_id_user_id_key
DO UPDATE SET
    duration = EXCLUDED.duration,
    vote = EXCLUDED.vote;

-- name: DeleteSceneFingerprintsByScene :exec
DELETE FROM scene_fingerprints WHERE scene_id = $1;

-- name: DeleteSceneFingerprint :exec
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
AND FP.hash = $1
AND FP.algorithm = $2
AND user_id = $3
AND scene_id = $4;

-- name: GetAllSceneFingerprints :many
SELECT f.algorithm, f.hash, sf.duration, sf.created_at, sf.user_id
FROM scene_fingerprints sf
JOIN fingerprints f ON sf.fingerprint_id = f.id
WHERE sf.scene_id = $1
ORDER BY f.algorithm, sf.created_at;

-- name: FindScenesByFingerprint :many
SELECT DISTINCT s.* FROM scenes s
JOIN scene_fingerprints sf ON s.id = sf.scene_id
JOIN fingerprints f ON sf.fingerprint_id = f.id
WHERE f.hash = $1 AND f.algorithm = $2 AND s.deleted = false;

-- name: GetAllFingerprints :many
-- Get all fingerprints for multiple scenes with aggregated vote data
-- When onlySubmitted is true, pass the actual user ID, when false pass NULL
SELECT
    SFP.scene_id,
    FP.hash,
    FP.algorithm,
    mode() WITHIN GROUP (ORDER BY SFP.duration)::INTEGER as duration,
    COUNT(CASE WHEN SFP.vote = 1 THEN 1 END) as submissions,
    COUNT(CASE WHEN SFP.vote = -1 THEN 1 END) as reports,
    SUM(SFP.vote) as net_submissions,
    MIN(SFP.created_at)::TIMESTAMP as created_at,
    MAX(SFP.created_at)::TIMESTAMP as updated_at,
    bool_or(SFP.user_id = sqlc.arg(current_user_id) AND SFP.vote = 1) as user_submitted,
    bool_or(SFP.user_id = sqlc.arg(current_user_id) AND SFP.vote = -1) as user_reported
FROM scene_fingerprints SFP
JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
WHERE SFP.scene_id = ANY(sqlc.arg(scene_ids)::UUID[])
  AND (sqlc.narg(filter_user_id)::uuid IS NULL OR SFP.user_id = sqlc.narg(filter_user_id))
GROUP BY SFP.scene_id, FP.algorithm, FP.hash
ORDER BY net_submissions DESC;
