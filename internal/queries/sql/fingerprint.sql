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
ON CONFLICT ON CONSTRAINT scene_fingerprints_scene_user_fp_key
DO UPDATE SET
    duration = EXCLUDED.duration,
    vote = EXCLUDED.vote;

-- name: DeleteSceneFingerprintsByScene :exec
DELETE FROM scene_fingerprints WHERE scene_id = $1;

-- name: ReassignOrphaningSceneFingerprints :exec
-- Reassign a deleted user's fingerprints to the sentinel user, but only on
-- scenes where no other user has any fingerprint.
UPDATE scene_fingerprints sf
SET user_id = sqlc.arg(target_user_id)
WHERE sf.user_id = sqlc.arg(source_user_id)
  AND NOT EXISTS (
    SELECT 1 FROM scene_fingerprints o
    WHERE o.scene_id = sf.scene_id
      AND o.user_id <> sqlc.arg(source_user_id)
  );

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

-- name: PruneSceneFingerprintsForMove :many
-- Prepare a fingerprint move by dropping reports and dupe fingerprint submissions
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = sqlc.arg(source_scene_id)
  AND (
    SFP.vote = -1
    OR EXISTS (
      SELECT 1 FROM scene_fingerprints SFP2
      WHERE SFP2.scene_id = sqlc.arg(target_scene_id)
        AND SFP2.fingerprint_id = SFP.fingerprint_id
        AND SFP2.user_id = SFP.user_id
    )
  )
RETURNING SFP.user_id, SFP.vote;

-- name: MoveSceneFingerprintSubmissions :many
UPDATE scene_fingerprints SFP
SET scene_id = sqlc.arg(target_scene_id)
FROM fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = sqlc.arg(source_scene_id)
RETURNING SFP.user_id;

-- name: DeleteAllSceneFingerprintSubmissions :execrows
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = $1
  AND FP.algorithm = $2
  AND SFP.scene_id = $3;

-- name: GetScenePhashSeeds :many
SELECT DISTINCT FP.id, FP.hash
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id = $1
  AND FP.algorithm = 'PHASH';

-- name: ExpandPhashNeighbors :many
-- The pg-spgist_hamming custom-scan hook turns this UNNEST + <@ into a single
-- batch BK-tree traversal when ≤64 hashes are supplied; caller must chunk.
-- The scene_id join is intentionally NOT here: the planner overestimates the
-- customscan's row count and picks a hash-join + seq scan of scene_fingerprints.
SELECT DISTINCT FP.id, FP.hash
FROM UNNEST(sqlc.arg('hashes')::BIGINT[]) phash
JOIN fingerprints FP
  ON FP.hash <@ (phash, sqlc.arg('distance')::INTEGER)
  AND FP.algorithm = 'PHASH';

-- name: GetSceneFingerprintScenes :many
SELECT fingerprint_id, scene_id
FROM scene_fingerprints
WHERE fingerprint_id = ANY(sqlc.arg('fingerprint_ids')::INT[]);

-- name: ExpandSceneCoMembers :many
SELECT DISTINCT FP.id, FP.hash
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id = ANY(sqlc.arg('scene_ids')::UUID[])
  AND FP.algorithm = 'PHASH';

-- name: LoadClusterSubmissions :many
SELECT
    fingerprint_id,
    scene_id,
    SUM(submissions)::INTEGER AS submissions,
    SUM(reports)::INTEGER AS reports,
    ARRAY_AGG(duration ORDER BY duration)::INTEGER[] AS durations,
    ARRAY_AGG(submissions ORDER BY duration)::INTEGER[] AS duration_submissions
FROM (
    SELECT
        SFP.fingerprint_id,
        SFP.scene_id,
        SFP.duration,
        COUNT(*) FILTER (WHERE SFP.vote = 1)::INTEGER AS submissions,
        COUNT(*) FILTER (WHERE SFP.vote = -1)::INTEGER AS reports
    FROM scene_fingerprints SFP
    WHERE SFP.fingerprint_id = ANY(sqlc.arg('fingerprint_ids')::INT[])
    GROUP BY SFP.fingerprint_id, SFP.scene_id, SFP.duration
) per_dur
GROUP BY fingerprint_id, scene_id;

-- name: LoadLinkedOshashSubmissions :many
SELECT DISTINCT
    OS_SFP.fingerprint_id AS oshash_fingerprint_id,
    PH_SFP.fingerprint_id AS phash_fingerprint_id,
    OS_FP.hash AS oshash_hash
FROM scene_fingerprints OS_SFP
JOIN fingerprints OS_FP ON OS_FP.id = OS_SFP.fingerprint_id AND OS_FP.algorithm = 'OSHASH'
JOIN scene_fingerprints PH_SFP
    ON PH_SFP.scene_id = OS_SFP.scene_id
    AND PH_SFP.user_id = OS_SFP.user_id
    AND ABS(EXTRACT(EPOCH FROM (OS_SFP.created_at - PH_SFP.created_at))) <= 60
WHERE PH_SFP.fingerprint_id = ANY(sqlc.arg('phash_fingerprint_ids')::INT[]);
