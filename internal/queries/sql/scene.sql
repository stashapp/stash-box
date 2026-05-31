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
    (sqlc.narg('hashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('hashes')::BIGINT[], 1) > 0
     AND id IN (
        SELECT scene_id
        FROM scene_fingerprints SFP
        JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
        WHERE FP.hash = ANY(sqlc.narg('hashes')::BIGINT[])
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
-- Token-at-a-time scoring. The search term is tokenized by the caller and
-- passed as an array. Each token is scored independently against every field
-- via disjunction_max, so a token that hits several fields (e.g. a studio named
-- after its performer) only contributes from its single best field instead of
-- summing across them.
--
-- Score = coverage tier + relevance tiebreak:
--   * coverage: each distinct token that matches anywhere adds a flat 10000, so
--     a scene matching more of the query always outranks one matching fewer,
--     regardless of BM25/IDF weighting (stops a single rare token outscoring
--     several common ones).
--   * relevance: ordinary BM25 (performer-weighted) breaks ties within a tier.
-- The 10000 constant must exceed the max achievable BM25 sum; search terms are
-- short so the relevance total stays well under it.
SELECT
    scene_id,
    pdb.agg('{"value_count": {"field": "scene_id"}}') OVER () as total_count
FROM scene_search
WHERE scene_id @@@ paradedb.boolean(should =>
    ARRAY(
        SELECT paradedb.const_score(10000.0, paradedb.disjunction_max(disjuncts => ARRAY[
            paradedb.match(field => 'scene_title', value => tok),
            paradedb.match(field => 'scene_code', value => tok),
            paradedb.match(field => 'scene_date', value => tok),
            paradedb.match(field => 'performer_names', value => tok),
            paradedb.match(field => 'studio_name', value => tok),
            paradedb.match(field => 'studio_aliases', value => tok),
            paradedb.match(field => 'network_name', value => tok),
            paradedb.match(field => 'network_aliases', value => tok)
        ]))
        FROM unnest(sqlc.arg('tokens')::TEXT[]) AS tok
    ) || ARRAY(
        SELECT paradedb.disjunction_max(disjuncts => ARRAY[
            paradedb.boost(factor => 2.0, query => paradedb.match(field => 'performer_names', value => tok)),
            paradedb.match(field => 'scene_title', value => tok),
            paradedb.match(field => 'scene_code', value => tok),
            paradedb.match(field => 'scene_date', value => tok),
            paradedb.match(field => 'studio_name', value => tok),
            paradedb.match(field => 'studio_aliases', value => tok),
            paradedb.match(field => 'network_name', value => tok),
            paradedb.match(field => 'network_aliases', value => tok)
        ])
        FROM unnest(sqlc.arg('tokens')::TEXT[]) AS tok
    )
)
ORDER BY pdb.score(scene_id) DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountScenesByPerformer :one
SELECT COUNT(*) FROM scene_performers WHERE performer_id = $1;

-- Scene fingerprints (use fingerprint.sql for most fingerprint operations)

-- name: FindScenesByFullFingerprintsWithHash :many
SELECT sqlc.embed(scenes), matches.hash FROM (
    -- Return the query phash from UNNEST so callers can route results back to
    -- the input fingerprint when distance > 0 and the stored hash differs.
    SELECT SFP.scene_id AS id, phash::BIGINT AS hash
    FROM UNNEST(sqlc.narg('phashes')::BIGINT[]) phash
    JOIN fingerprints FP ON FP.hash <@ (phash, sqlc.arg('distance')::INTEGER)
        AND FP.algorithm = 'PHASH'
    JOIN scene_fingerprints SFP ON SFP.fingerprint_id = FP.id
    WHERE sqlc.narg('phashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('phashes')::BIGINT[], 1) > 0
    GROUP BY SFP.scene_id, phash

    UNION

    SELECT SFP.scene_id AS id, FP.hash
    FROM scene_fingerprints SFP
    JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
    WHERE FP.hash = ANY(sqlc.narg('hashes')::BIGINT[])
        AND sqlc.narg('hashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('hashes')::BIGINT[], 1) > 0
    GROUP BY SFP.scene_id, FP.hash
) matches
JOIN scenes ON scenes.id = matches.id AND scenes.deleted = FALSE;

-- name: FindScenesByFingerprintsExactWithHash :many
SELECT sqlc.embed(scenes), matches.hash FROM (
    SELECT SFP.scene_id AS id, FP.hash
    FROM scene_fingerprints SFP
    JOIN fingerprints FP ON SFP.fingerprint_id = FP.id
    WHERE FP.hash = ANY(sqlc.narg('hashes')::BIGINT[])
        AND sqlc.narg('hashes')::BIGINT[] IS NOT NULL AND array_length(sqlc.narg('hashes')::BIGINT[], 1) > 0
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
