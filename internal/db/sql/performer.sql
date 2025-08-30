-- Performer queries

-- name: CreatePerformer :one
INSERT INTO performers (
    id, name, disambiguation, gender, birthdate, 
    ethnicity, country, eye_color, hair_color, height, cup_size, 
    band_size, hip_size, waist_size, breast_type, career_start_year, 
    career_end_year, created_at, updated_at, deleted, deathdate
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 
    $13, $14, $15, $16, $17, $18, $19, $20, $21
)
RETURNING *;

-- name: UpdatePerformer :one
UPDATE performers 
SET name = $2, disambiguation = $3, gender = $4, birthdate = $5, 
    ethnicity = $6, country = $7, eye_color = $8, hair_color = $9, 
    height = $10, cup_size = $11, band_size = $12, hip_size = $13, 
    waist_size = $14, breast_type = $15, career_start_year = $16, 
    career_end_year = $17, updated_at = $18, deleted = $19, deathdate = $20
WHERE id = $1
RETURNING *;

-- name: UpdatePerformerPartial :one
UPDATE performers 
SET name = COALESCE(sqlc.narg('name'), name),
    disambiguation = COALESCE(sqlc.narg('disambiguation'), disambiguation),
    gender = COALESCE(sqlc.narg('gender'), gender),
    birthdate = COALESCE(sqlc.narg('birthdate'), birthdate),
    ethnicity = COALESCE(sqlc.narg('ethnicity'), ethnicity),
    country = COALESCE(sqlc.narg('country'), country),
    eye_color = COALESCE(sqlc.narg('eye_color'), eye_color),
    hair_color = COALESCE(sqlc.narg('hair_color'), hair_color),
    height = COALESCE(sqlc.narg('height'), height),
    cup_size = COALESCE(sqlc.narg('cup_size'), cup_size),
    band_size = COALESCE(sqlc.narg('band_size'), band_size),
    hip_size = COALESCE(sqlc.narg('hip_size'), hip_size),
    waist_size = COALESCE(sqlc.narg('waist_size'), waist_size),
    breast_type = COALESCE(sqlc.narg('breast_type'), breast_type),
    career_start_year = COALESCE(sqlc.narg('career_start_year'), career_start_year),
    career_end_year = COALESCE(sqlc.narg('career_end_year'), career_end_year),
    updated_at = $2,
    deleted = COALESCE(sqlc.narg('deleted'), deleted),
    deathdate = COALESCE(sqlc.narg('deathdate'), deathdate)
WHERE id = $1
RETURNING *;

-- name: DeletePerformer :exec
DELETE FROM performers WHERE id = $1;

-- name: SoftDeletePerformer :one
UPDATE performers SET deleted = true, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: FindPerformer :one
SELECT * FROM performers WHERE id = $1;

-- name: FindPerformersWithRedirects :many
SELECT P.* FROM performers P
WHERE P.id = ANY($1::UUID[]) AND P.deleted = FALSE
UNION
SELECT T.* FROM performer_redirects R
JOIN performers T ON T.id = R.target_id
WHERE R.source_id = ANY($1::UUID[]) AND T.deleted = FALSE;

-- name: GetPerformers :many
SELECT * FROM performers WHERE id = ANY($1::UUID[]) ORDER BY name;

-- name: FindPerformersByIds :many
SELECT * FROM performers WHERE id = ANY($1::UUID[]);

-- name: FindPerformerByName :one
SELECT * FROM performers WHERE UPPER(name) = UPPER($1) AND deleted = false;

-- name: CountPerformers :one
SELECT COUNT(*) FROM performers WHERE deleted = false;

-- name: GetAllPerformers :many
SELECT * FROM performers WHERE deleted = false ORDER BY name LIMIT 20;

-- name: FindExistingPerformers :many
SELECT * FROM performers
WHERE (
    (sqlc.narg('name')::text IS NOT NULL AND TRIM(LOWER(name)) = TRIM(LOWER(sqlc.narg('name'))) AND
     CASE
       WHEN sqlc.narg('disambiguation')::text IS NOT NULL
       THEN TRIM(LOWER(disambiguation)) = TRIM(LOWER(sqlc.narg('disambiguation')))
       ELSE (disambiguation IS NULL OR disambiguation = '')
     END)
    OR
    (sqlc.narg('urls')::text[] IS NOT NULL AND
     id IN (
       SELECT performer_id
       FROM performer_urls
       WHERE url = ANY(sqlc.narg('urls'))
       GROUP BY performer_id
     ))
);

-- name: FindPerformersByURL :many
SELECT P.*
FROM performers P
JOIN performer_urls PU ON PU.performer_id = P.id
WHERE LOWER(PU.url) = LOWER(sqlc.narg('url'))
LIMIT sqlc.narg('limit');

-- name: SearchPerformers :many
SELECT P.* FROM (
    SELECT id, SUM(similarity) AS score FROM (
        SELECT P.id, similarity(P.name, sqlc.narg('term')) AS similarity
        FROM performers P
        WHERE P.deleted = FALSE AND P.name % sqlc.narg('term') AND similarity(P.name, sqlc.narg('term')) > 0.5
    UNION
        SELECT P.id, (similarity(COALESCE(PA.alias, ''), sqlc.narg('term')) * 0.5) AS similarity
        FROM performers P
        LEFT JOIN performer_aliases PA on PA.performer_id = P.id
        WHERE P.deleted = FALSE AND PA.alias % sqlc.narg('term') AND similarity(COALESCE(PA.alias, ''), sqlc.narg('term')) > 0.6
    UNION
        SELECT P.id, (similarity(COALESCE(P.disambiguation, ''), sqlc.narg('term')) * 0.3) AS similarity
        FROM performers P
        WHERE P.deleted = FALSE AND P.disambiguation % sqlc.narg('term') AND similarity(COALESCE(P.disambiguation, ''), sqlc.narg('term')) > 0.7
    ) A
    GROUP BY id
    ORDER BY score DESC
    LIMIT sqlc.narg('limit')
) T
JOIN performers P ON P.id = T.id
ORDER BY score DESC;

-- Performer aliases

-- name: CreatePerformerAlias :exec
INSERT INTO performer_aliases (performer_id, alias) VALUES ($1, $2);

-- name: DeletePerformerAliases :exec
DELETE FROM performer_aliases WHERE performer_id = $1;

-- name: GetPerformerAliases :many
SELECT alias FROM performer_aliases WHERE performer_id = $1;

-- name: FindPerformerByAlias :one
SELECT p.* FROM performers p
JOIN performer_aliases pa ON p.id = pa.performer_id
WHERE UPPER(pa.alias) = UPPER($1) AND p.deleted = false;

-- Performer URLs

-- name: CreatePerformerURL :exec
INSERT INTO performer_urls (performer_id, url, site_id) VALUES ($1, $2, $3);

-- name: DeletePerformerURLs :exec
DELETE FROM performer_urls WHERE performer_id = $1;

-- name: GetPerformerURLs :many
SELECT url, site_id FROM performer_urls WHERE performer_id = $1;

-- Performer tattoos

-- name: CreatePerformerTattoo :exec
INSERT INTO performer_tattoos (performer_id, location, description) VALUES ($1, $2, $3);

-- name: DeletePerformerTattoos :exec
DELETE FROM performer_tattoos WHERE performer_id = $1;

-- name: GetPerformerTattoos :many
SELECT location, description FROM performer_tattoos WHERE performer_id = $1;

-- Performer piercings

-- name: CreatePerformerPiercing :exec
INSERT INTO performer_piercings (performer_id, location, description) VALUES ($1, $2, $3);

-- name: DeletePerformerPiercings :exec
DELETE FROM performer_piercings WHERE performer_id = $1;

-- name: GetPerformerPiercings :many
SELECT location, description FROM performer_piercings WHERE performer_id = $1;

-- Performer redirects

-- name: CreatePerformerRedirect :exec
INSERT INTO performer_redirects (source_id, target_id) VALUES ($1, $2);

-- name: UpdatePerformerRedirects :exec
UPDATE performer_redirects SET target_id = @new_performer_id WHERE target_id = @old_performer_id;

-- name: DeletePerformerRedirect :exec
DELETE FROM performer_redirects WHERE source_id = $1;

-- name: FindPerformerRedirect :one
SELECT target_id FROM performer_redirects WHERE source_id = $1;

-- Performer favorites

-- name: DeletePerformerFavorites :exec
DELETE FROM performer_favorites WHERE performer_id = $1;

-- name: ReassignPerformerFavorites :exec
UPDATE performer_favorites
   SET performer_id = @new_performer_id
   WHERE performer_favorites.performer_id = @old_performer_id
   AND user_id NOT IN (
    SELECT user_id
    FROM performer_favorites PF
    WHERE PF.performer_id = @new_performer_id
  );

-- name: CreatePerformerFavorite :exec
INSERT INTO performer_favorites (performer_id, user_id, created_at) VALUES ($1, $2, $3);

-- name: DeletePerformerFavorite :exec
DELETE FROM performer_favorites WHERE performer_id = $1 AND user_id = $2;

-- name: FindPerformerFavoritesByIds :many
-- Check favorite status for multiple performers for a specific user
SELECT performer_id, (performer_id IS NOT NULL)::BOOLEAN as is_favorite
FROM performer_favorites
WHERE performer_id = ANY(sqlc.arg(performer_ids)::UUID[]) AND user_id = sqlc.arg(user_id);

-- Performer images

-- name: GetPerformerImageIDs :many
SELECT image_id FROM performer_images WHERE performer_id = $1;

-- name: GetPerformerImages :many
SELECT images.* FROM images
JOIN performer_images ON performer_images.image_id = images.id
WHERE performer_images.performer_id = $1;

-- name: DeletePerformerImages :exec
DELETE FROM performer_images WHERE performer_id = $1;

-- name: CreatePerformerImages :copyfrom
INSERT INTO performer_images (performer_id, image_id) VALUES ($1, $2);

-- name: CreatePerformerAliases :copyfrom
INSERT INTO performer_aliases (performer_id, alias) VALUES ($1, $2);

-- name: CreatePerformerTattoos :copyfrom
INSERT INTO performer_tattoos (performer_id, location, description) VALUES ($1, $2, $3);

-- name: CreatePerformerPiercings :copyfrom
INSERT INTO performer_piercings (performer_id, location, description) VALUES ($1, $2, $3);

-- name: CreatePerformerURLs :copyfrom
INSERT INTO performer_urls (performer_id, url, site_id) VALUES ($1, $2, $3);

-- name: SetScenePerformerAlias :exec
UPDATE scene_performers
SET "as" = $2
WHERE performer_id = $1
AND "as" IS NULL;

-- name: ClearScenePerformerAlias :exec
UPDATE scene_performers
SET "as" = NULL
WHERE performer_id = $1
AND "as" = $2;

-- name: ReassignPerformerAliases :exec
UPDATE scene_performers
SET performer_id = @new_performer_id
WHERE scene_performers.performer_id = @old_performer_id
AND scene_id NOT IN (SELECT scene_id from scene_performers sp WHERE sp.performer_id = @new_performer_id);

-- name: DeletePerformerScenes :exec
DELETE FROM scene_performers WHERE performer_id = $1;

-- name: FindMergeIDsByPerformerIds :many
-- Find merge target IDs for performers (for merges where these are sources)
SELECT source_id as performer_id, target_id as merge_id FROM performer_redirects WHERE source_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- name: FindMergeIDsBySourcePerformerIds :many
-- Find merge source IDs for performers (for merges where these are targets)
SELECT target_id as performer_id, source_id as merge_id FROM performer_redirects WHERE target_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- name: FindPerformerAliasesByIds :many
-- Get aliases for multiple performers
SELECT performer_id, alias FROM performer_aliases WHERE performer_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- name: FindPerformerTattoosByIds :many
-- Get tattoos for multiple performers
SELECT performer_id, location, description FROM performer_tattoos WHERE performer_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- name: FindPerformerPiercingsByIds :many
-- Get piercings for multiple performers
SELECT performer_id, location, description FROM performer_piercings WHERE performer_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- name: FindPerformerUrlsByIds :many
-- Get URLs for multiple performers
SELECT performer_id, url, site_id FROM performer_urls WHERE performer_id = ANY(sqlc.arg(performer_ids)::UUID[]);

-- Complex performer queries would require dynamic SQL for:
-- - Multi-field text search across name, aliases, disambiguation
-- - Physical attribute range filtering (height, measurements, etc.)
-- - Date range filtering for birth dates, career spans
-- - Age calculations with partial date support
-- - Geographic filtering by country/region
-- - Scene count and activity statistics
-- - Fuzzy name matching with phonetic algorithms
-- - Tag-based filtering for scene associations
-- These are better handled by the existing query builder patterns
