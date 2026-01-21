-- Scene queries

-- name: CreateScene :one
INSERT INTO scenes (id, title, details, date, production_date, studio_id, duration, director, code, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
RETURNING *;

-- name: UpdateScene :one
UPDATE scenes 
SET title = $2, details = $3, date = $4, production_date = $5, studio_id = $6, 
    duration = $7, director = $8, code = $9, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteScene :exec
DELETE FROM scenes WHERE id = $1;

-- name: SoftDeleteScene :one
UPDATE scenes SET deleted = true, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: DeleteSceneStudios :exec
UPDATE scenes SET studio_id = NULL WHERE studio_id = $1;

-- name: UpdateSceneStudios :exec
UPDATE scenes SET studio_id = @target_id WHERE studio_id = @source_id;

-- name: FindScene :one
SELECT * FROM scenes WHERE id = $1;

-- name: GetScenes :many
SELECT * FROM scenes WHERE id = ANY($1::UUID[]) ORDER BY title;

-- name: FindExistingScenes :many
SELECT * FROM scenes WHERE (
    (sqlc.narg('title')::text IS NOT NULL AND sqlc.narg('studio_id')::uuid IS NOT NULL
     AND TRIM(LOWER(title)) = TRIM(LOWER(sqlc.narg('title')))
     AND studio_id = sqlc.narg('studio_id'))
    OR
    (sqlc.narg('hashes')::text[] IS NOT NULL AND array_length(sqlc.narg('hashes')::text[], 1) > 0
     AND id IN (
        SELECT scene_id
        FROM scene_fingerprints SFP
        JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
        WHERE FP.hash = ANY(sqlc.narg('hashes')::text[])
        GROUP BY scene_id
    ))
)
AND deleted = FALSE;

-- name: FindSceneByURL :many
SELECT S.*
FROM scenes S
JOIN scene_urls SU ON SU.scene_id = S.id
WHERE LOWER(SU.url) = LOWER(sqlc.narg('url'))
AND S.deleted = FALSE
LIMIT sqlc.arg('limit');

-- name: SearchScenes :many
SELECT S.* FROM scenes S
LEFT JOIN scene_search SS ON SS.scene_id = S.id
WHERE (
    to_tsvector('english', COALESCE(scene_date, '')) ||
    to_tsvector('english', studio_name) ||
    to_tsvector('english', COALESCE(performer_names, '')) ||
    to_tsvector('english', scene_title) ||
    to_tsvector('english', COALESCE(scene_code, ''))
) @@ websearch_to_tsquery('english', sqlc.narg('term'))
AND S.deleted = FALSE
LIMIT sqlc.arg('limit');

-- name: CountScenesByPerformer :one
SELECT COUNT(*) FROM scene_performers WHERE performer_id = $1;

-- Scene fingerprints (use fingerprint.sql for most fingerprint operations)

-- name: FindScenesByFingerprints :many
SELECT scenes.* FROM scenes
WHERE id IN (
    SELECT scene_id AS id
    FROM scene_fingerprints SFP
    JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
    WHERE FP.hash = ANY(sqlc.narg('fingerprints')::TEXT[])
    GROUP BY scene_id
)
AND deleted = FALSE;

-- name: FindScenesByFullFingerprints :many
SELECT scenes.* FROM scenes
WHERE id IN (
    SELECT SFP.scene_id AS id
    FROM UNNEST(sqlc.narg('phashes')::BIGINT[]) phash
    JOIN fingerprints FP ON ('x' || FP.hash)::bit(64)::bigint <@ (phash::BIGINT, sqlc.arg('distance')::INTEGER)
        AND FP.algorithm = 'PHASH'
    JOIN scene_fingerprints SFP ON SFP.fingerprint_id = FP.id
    WHERE sqlc.narg('phashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('phashes')::BIGINT[], 1) > 0
    GROUP BY SFP.scene_id

    UNION

    SELECT SFP.scene_id AS id
    FROM scene_fingerprints SFP
    JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
    WHERE FP.hash = ANY(sqlc.narg('hashes')::TEXT[])
        AND sqlc.narg('hashes')::TEXT[] IS NOT NULL AND array_length(sqlc.narg('hashes')::TEXT[], 1) > 0
    GROUP BY SFP.scene_id
)
AND deleted = FALSE;

-- name: FindScenesByFullFingerprintsWithHash :many
SELECT sqlc.embed(scenes), matches.hash FROM (
    SELECT SFP.scene_id AS id, FP.hash
    FROM UNNEST(sqlc.narg('phashes')::BIGINT[]) phash
    JOIN fingerprints FP ON ('x' || FP.hash)::bit(64)::bigint <@ (phash::BIGINT, sqlc.arg('distance')::INTEGER)
        AND FP.algorithm = 'PHASH'
    JOIN scene_fingerprints SFP ON SFP.fingerprint_id = FP.id
    WHERE sqlc.narg('phashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('phashes')::BIGINT[], 1) > 0
    GROUP BY SFP.scene_id, FP.hash

    UNION

    SELECT SFP.scene_id AS id, FP.hash
    FROM scene_fingerprints SFP
    JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
    WHERE FP.hash = ANY(sqlc.narg('hashes')::TEXT[])
        AND sqlc.narg('hashes')::TEXT[] IS NOT NULL AND array_length(sqlc.narg('hashes')::TEXT[], 1) > 0
    GROUP BY SFP.scene_id, FP.hash
) matches
JOIN scenes ON scenes.id = matches.id AND scenes.deleted = FALSE;

-- Scene URLs

-- name: CreateSceneURLs :copyfrom
INSERT INTO scene_urls (scene_id, url, site_id) VALUES ($1, $2, $3);

-- name: DeleteSceneURLs :exec
DELETE FROM scene_urls WHERE scene_id = $1;

-- name: GetSceneURLs :many
SELECT url, site_id FROM scene_urls WHERE scene_id = $1;

-- Scene performers

-- name: CreateScenePerformers :copyfrom
INSERT INTO scene_performers (scene_id, performer_id, "as") VALUES ($1, $2, $3);

-- name: DeleteScenePerformers :exec
DELETE FROM scene_performers WHERE scene_id = $1;

-- name: GetScenePerformers :many
SELECT sqlc.embed(P), "as" FROM scene_performers SP JOIN performers P ON SP.performer_id = P.id WHERE scene_id = $1;

-- Scene images

-- name: DeleteSceneImages :exec
DELETE FROM scene_images WHERE scene_id = $1;

-- name: CreateSceneImages :copyfrom
INSERT INTO scene_images (scene_id, image_id) VALUES ($1, $2);

-- Scene redirects

-- name: CreateSceneRedirect :exec
INSERT INTO scene_redirects (source_id, target_id) VALUES ($1, $2);

-- name: UpdateSceneRedirects :exec
UPDATE scene_redirects SET target_id = @new_target_id WHERE target_id = @old_target_id;

-- name: FindSceneAppearancesByIds :many
-- Get performer appearances for multiple scenes
SELECT scene_id, performer_id, "as" FROM scene_performers WHERE scene_id = ANY(sqlc.arg(scene_ids)::UUID[]);

-- name: FindSceneUrlsByIds :many
-- Get URLs for multiple scenes
SELECT scene_id, url, site_id FROM scene_urls WHERE scene_id = ANY(sqlc.arg(scene_ids)::UUID[]);
