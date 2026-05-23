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

-- name: DeleteDuplicateSceneFingerprintSubmissions :execrows
-- Delete source-scene submissions whose (fingerprint, user) already exists on the target scene,
-- so MoveSceneFingerprintSubmissions can move the remainder without tripping the unique constraint.
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = sqlc.arg(source_scene_id)
  AND EXISTS (
    SELECT 1 FROM scene_fingerprints SFP2
    WHERE SFP2.scene_id = sqlc.arg(target_scene_id)
      AND SFP2.fingerprint_id = SFP.fingerprint_id
      AND SFP2.user_id = SFP.user_id
  );

-- name: MoveSceneFingerprintSubmissions :execrows
UPDATE scene_fingerprints SFP
SET scene_id = sqlc.arg(target_scene_id)
FROM fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = sqlc.arg(hash)
  AND FP.algorithm = sqlc.arg(algorithm)
  AND SFP.scene_id = sqlc.arg(source_scene_id);

-- name: DeleteAllSceneFingerprintSubmissions :execrows
DELETE FROM scene_fingerprints SFP
USING fingerprints FP
WHERE SFP.fingerprint_id = FP.id
  AND FP.hash = $1
  AND FP.algorithm = $2
  AND SFP.scene_id = $3;

-- name: GetScenePhashFingerprintIDs :many
-- Returns the PHASH fingerprint ids attached to a scene (used as the BFS seed).
SELECT DISTINCT FP.id
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id = $1
  AND FP.algorithm = 'PHASH';

-- name: ExpandPhashNeighbors :many
-- Given a set of PHASH fingerprint ids, return all PHASH neighbors within `distance`
-- using the bktree index. Includes the seeds in the result.
SELECT DISTINCT FP2.id AS neighbor_id, SFP.scene_id
FROM fingerprints FP1
JOIN fingerprints FP2
  ON FP2.algorithm = 'PHASH'
  AND FP2.hash <@ (FP1.hash, sqlc.arg('distance')::INTEGER)
JOIN scene_fingerprints SFP ON SFP.fingerprint_id = FP2.id
WHERE FP1.id = ANY(sqlc.arg('fingerprint_ids')::INT[])
  AND FP1.algorithm = 'PHASH';

-- name: ExpandSceneCoMembers :many
-- Given a set of scene ids, return all PHASH fingerprint ids that have a submission
-- on any of those scenes.
SELECT DISTINCT FP.id AS fingerprint_id
FROM scene_fingerprints SFP
JOIN fingerprints FP ON FP.id = SFP.fingerprint_id
WHERE SFP.scene_id = ANY(sqlc.arg('scene_ids')::UUID[])
  AND FP.algorithm = 'PHASH';

-- name: LoadClusterEdges :many
-- For all pairs (a, b) of PHASH fingerprints within `distance`, return the edge.
-- Limited to the closure so the result stays small.
SELECT FP1.id AS a_id, FP2.id AS b_id
FROM fingerprints FP1
JOIN fingerprints FP2
  ON FP2.algorithm = 'PHASH'
  AND FP2.id > FP1.id
  AND FP2.hash <@ (FP1.hash, sqlc.arg('distance')::INTEGER)
WHERE FP1.id = ANY(sqlc.arg('fingerprint_ids')::INT[])
  AND FP2.id = ANY(sqlc.arg('fingerprint_ids')::INT[])
  AND FP1.algorithm = 'PHASH';

-- name: LoadClusterFingerprints :many
-- Returns hash + algorithm for the cluster member fingerprints.
SELECT id, hash, algorithm
FROM fingerprints
WHERE id = ANY(sqlc.arg('fingerprint_ids')::INT[]);

-- name: LoadClusterSubmissions :many
-- Aggregate scene_fingerprints rows for the cluster members.
SELECT
    SFP.fingerprint_id,
    SFP.scene_id,
    COUNT(CASE WHEN SFP.vote = 1 THEN 1 END)::INTEGER AS submissions,
    COUNT(CASE WHEN SFP.vote = -1 THEN 1 END)::INTEGER AS reports,
    ARRAY_AGG(DISTINCT SFP.duration ORDER BY SFP.duration)::INTEGER[] AS durations
FROM scene_fingerprints SFP
WHERE SFP.fingerprint_id = ANY(sqlc.arg('fingerprint_ids')::INT[])
GROUP BY SFP.fingerprint_id, SFP.scene_id;

-- name: LoadClusterPhashSubmissions :many
-- Per-row (not aggregated) phash submissions for OSHASH linking.
SELECT
    SFP.fingerprint_id,
    SFP.scene_id,
    SFP.user_id,
    SFP.created_at
FROM scene_fingerprints SFP
WHERE SFP.fingerprint_id = ANY(sqlc.arg('fingerprint_ids')::INT[])
  AND SFP.vote = 1;

-- name: LoadLinkedOshashSubmissions :many
-- Find OSHASH submissions that share (user_id, scene_id) with a phash submission
-- where the OSHASH was submitted within 1 second of the phash. Bounded to the
-- cluster's scenes for cost.
SELECT
    OS_SFP.fingerprint_id AS oshash_fingerprint_id,
    PH_SFP.fingerprint_id AS phash_fingerprint_id,
    OS_SFP.scene_id,
    OS_SFP.user_id,
    OS_SFP.created_at,
    OS_SFP.vote,
    OS_SFP.duration
FROM scene_fingerprints OS_SFP
JOIN fingerprints OS_FP ON OS_FP.id = OS_SFP.fingerprint_id AND OS_FP.algorithm = 'OSHASH'
JOIN scene_fingerprints PH_SFP
    ON PH_SFP.scene_id = OS_SFP.scene_id
    AND PH_SFP.user_id = OS_SFP.user_id
    AND ABS(EXTRACT(EPOCH FROM (OS_SFP.created_at - PH_SFP.created_at))) < 1
WHERE PH_SFP.fingerprint_id = ANY(sqlc.arg('phash_fingerprint_ids')::INT[]);
