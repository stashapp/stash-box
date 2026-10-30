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
		WHERE f.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid)
          AND fp.hash = sqlc.arg(hash) AND fp.algorithm = sqlc.arg(algorithm) AND f.vote = 1
) AS exists;

-- name: InsertSceneFingerprints :execrows
-- Resolve a complete batch at the SQL boundary. LEFT JOIN keeps missing UUIDs
-- as NULL so constraints reject them instead of silently skipping rows.
INSERT INTO scene_fingerprints (fingerprint_id, scene_id, user_id, duration)
SELECT input.fingerprint_id, s.internal_id, u.internal_id, input.duration
FROM (
  SELECT unnest(sqlc.arg(fingerprint_ids)::integer[]) AS fingerprint_id,
         unnest(sqlc.arg(scene_ids)::uuid[]) AS scene_id,
         unnest(sqlc.arg(user_ids)::uuid[]) AS user_id,
         unnest(sqlc.arg(durations)::integer[]) AS duration
) AS input
LEFT JOIN scenes s ON s.id = input.scene_id
LEFT JOIN users u ON u.id = input.user_id;

-- name: CreateOrReplaceFingerprint :exec
INSERT INTO scene_fingerprints (fingerprint_id, scene_id, user_id, duration, vote)
VALUES (
  sqlc.arg(fingerprint_id),
  (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid),
  (SELECT internal_id FROM users WHERE id = sqlc.arg(user_id)::uuid),
  sqlc.arg(duration), sqlc.arg(vote)
)
ON CONFLICT ON CONSTRAINT scene_fingerprints_scene_user_fp_key
DO UPDATE SET
    duration = EXCLUDED.duration,
    vote = EXCLUDED.vote;

-- name: DeleteSceneFingerprintsByScene :exec
DELETE FROM scene_fingerprints WHERE scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: ReassignUniqueSceneFingerprints :exec
-- Reassign to the sentinel user only the deleted user's scene fingerprints that are unique
UPDATE scene_fingerprints sf
SET user_id = (SELECT internal_id FROM users WHERE id = sqlc.arg(target_user_id)::uuid)
WHERE sf.user_id = (SELECT internal_id FROM users WHERE id = sqlc.arg(source_user_id)::uuid)
  AND NOT EXISTS (
    SELECT 1 FROM scene_fingerprints other
    WHERE other.scene_id = sf.scene_id
      AND other.fingerprint_id = sf.fingerprint_id
      AND other.user_id <> sf.user_id
  );

-- name: DeleteSceneFingerprint :exec
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
AND FP.hash = $1
AND FP.algorithm = $2
AND user_id = (SELECT internal_id FROM users WHERE id = sqlc.arg(user_id)::uuid)
AND scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: GetAllSceneFingerprints :many
SELECT f.algorithm, f.hash, sf.duration, sf.created_at, u.id AS user_id
FROM scene_fingerprints sf
JOIN fingerprints f ON sf.fingerprint_id = f.id
JOIN users u ON u.internal_id = sf.user_id
WHERE sf.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid)
ORDER BY f.algorithm, sf.created_at;

-- name: GetAllFingerprints :many
-- Get all fingerprints for multiple scenes with aggregated vote data
-- When onlySubmitted is true, pass the actual user ID, when false pass NULL
SELECT
    s.id AS scene_id,
    FP.hash,
    FP.algorithm,
    mode() WITHIN GROUP (ORDER BY SFP.duration)::INTEGER as duration,
    COUNT(CASE WHEN SFP.vote = 1 THEN 1 END) as submissions,
    COUNT(CASE WHEN SFP.vote = -1 THEN 1 END) as reports,
    SUM(SFP.vote) as net_submissions,
    MIN(SFP.created_at)::TIMESTAMP as created_at,
    MAX(SFP.created_at)::TIMESTAMP as updated_at,
    bool_or(SFP.user_id = COALESCE((SELECT internal_id FROM users WHERE id = sqlc.arg(current_user_id)::uuid), 0) AND SFP.vote = 1) as user_submitted,
    bool_or(SFP.user_id = COALESCE((SELECT internal_id FROM users WHERE id = sqlc.arg(current_user_id)::uuid), 0) AND SFP.vote = -1) as user_reported
FROM scene_fingerprints SFP
JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
JOIN scenes s ON s.internal_id = SFP.scene_id
WHERE s.id = ANY(sqlc.arg(scene_ids)::UUID[])
  AND (sqlc.narg(filter_user_id)::uuid IS NULL OR SFP.user_id = (SELECT internal_id FROM users WHERE id = sqlc.narg(filter_user_id)::uuid))
GROUP BY s.id, FP.algorithm, FP.hash
ORDER BY net_submissions DESC;

-- name: PruneSceneFingerprintsForMove :many
-- Prepare a fingerprint move by dropping reports and dupe fingerprint submissions
WITH removed AS (
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(source_scene_id)::uuid)
  AND (
    SFP.vote = -1
    OR EXISTS (
      SELECT 1 FROM scene_fingerprints SFP2
      WHERE SFP2.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(target_scene_id)::uuid)
        AND SFP2.fingerprint_id = SFP.fingerprint_id
        AND SFP2.user_id = SFP.user_id
    )
  )
RETURNING SFP.user_id, SFP.vote
)
SELECT u.id AS user_id, removed.vote FROM removed JOIN users u ON u.internal_id = removed.user_id;

-- name: MoveSceneFingerprintSubmissions :many
UPDATE scene_fingerprints SFP
SET scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(target_scene_id)::uuid)
FROM fingerprints FP, users u
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(source_scene_id)::uuid)
  AND u.internal_id = SFP.user_id
RETURNING u.id AS user_id;

-- name: DeleteAllSceneFingerprintSubmissions :execrows
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = $1
  AND FP.algorithm = $2
  AND SFP.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: GetScenePhashSeeds :many
SELECT DISTINCT FP.id, FP.hash
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid)
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
SELECT sf.fingerprint_id, s.id AS scene_id
FROM scene_fingerprints sf
JOIN scenes s ON s.internal_id = sf.scene_id
WHERE fingerprint_id = ANY(sqlc.arg('fingerprint_ids')::INT[]);

-- name: ExpandSceneCoMembers :many
SELECT DISTINCT FP.id, FP.hash
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id IN (SELECT internal_id FROM scenes WHERE id = ANY(sqlc.arg('scene_ids')::UUID[]))
  AND FP.algorithm = 'PHASH';

-- name: LoadClusterSubmissions :many
SELECT
    fingerprint_id,
    s.id AS scene_id,
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
JOIN scenes s ON s.internal_id = per_dur.scene_id
GROUP BY fingerprint_id, s.id;

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
