-- Studio queries

-- name: CreateStudio :one
INSERT INTO studios (id, name, parent_studio_id, created_at, updated_at)
VALUES ($1, $2, $3, now(), now())
RETURNING *;

-- name: UpdateStudio :one
UPDATE studios 
SET name = $2, parent_studio_id = $3, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteStudio :exec
DELETE FROM studios WHERE id = $1;

-- name: SoftDeleteStudio :one
UPDATE studios SET deleted = true, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: FindStudio :one
SELECT * FROM studios WHERE id = $1;

-- name: GetStudios :many
SELECT * FROM studios WHERE id = ANY($1::UUID[]) ORDER BY name;

-- name: FindStudioByName :one
SELECT * FROM studios WHERE UPPER(name) = UPPER($1) AND deleted = false;

-- name: SearchStudios :many
SELECT S.* FROM (
    SELECT id, SUM(similarity) AS score FROM (
        SELECT S.id, similarity(S.name, sqlc.narg('term')) AS similarity
        FROM studios S
        WHERE S.deleted = FALSE AND S.name % sqlc.narg('term') AND similarity(S.name, sqlc.narg('term')) > 0.5
    UNION
        SELECT S.id, (similarity(COALESCE(SA.alias, ''), sqlc.narg('term')) * 0.5) AS similarity
        FROM studios S
        LEFT JOIN studio_aliases SA on SA.studio_id = S.id
        WHERE S.deleted = FALSE AND SA.alias % sqlc.narg('term') AND similarity(COALESCE(SA.alias, ''), sqlc.narg('term')) > 0.5
    ) A
    GROUP BY id
    ORDER BY score DESC
    LIMIT sqlc.arg('limit')
) T
JOIN studios S ON S.id = T.id
ORDER BY score DESC;

-- name: GetStudiosByPerformer :many
SELECT 
    sqlc.embed(studios),
    COUNT(scenes.id) as scene_count
FROM studios 
JOIN scenes ON studios.id = scenes.studio_id
JOIN scene_performers SP ON scenes.id = SP.scene_id
WHERE SP.performer_id = $1
GROUP BY studios.id;

-- name: GetChildStudios :many
SELECT * FROM studios WHERE parent_studio_id = $1 AND deleted = false ORDER BY name;

-- name: GetRootStudios :many
SELECT * FROM studios WHERE parent_studio_id IS NULL AND deleted = false ORDER BY name;

-- Studio URLs

-- name: CreateStudioURLs :copyfrom
INSERT INTO studio_urls (studio_id, url, site_id) VALUES ($1, $2, $3);

-- name: DeleteStudioURLs :exec
DELETE FROM studio_urls WHERE studio_id = $1;

-- name: GetStudioURLs :many
SELECT * FROM studio_urls WHERE studio_id = $1;

-- Studio images

-- name: CreateStudioImages :copyfrom
INSERT INTO studio_images (studio_id, image_id) VALUES ($1, $2);

-- name: GetStudioImages :many
SELECT image_id FROM studio_images WHERE studio_id = $1;

-- name: DeleteStudioImages :exec
DELETE FROM studio_images WHERE studio_id = $1;

-- Studio aliases

-- name: CreateStudioAlias :exec
INSERT INTO studio_aliases (studio_id, alias) VALUES ($1, $2);

-- name: CreateStudioAliases :copyfrom
INSERT INTO studio_aliases (studio_id, alias) VALUES ($1, $2);

-- name: DeleteStudioAliases :exec
DELETE FROM studio_aliases WHERE studio_id = $1;

-- name: GetStudioAliases :many
SELECT alias FROM studio_aliases WHERE studio_id = $1;

-- name: FindStudioByAlias :one
SELECT s.* FROM studios s
JOIN studio_aliases sa ON s.id = sa.studio_id
WHERE UPPER(sa.alias) = UPPER($1) AND s.deleted = false;

-- Studio redirects

-- name: CreateStudioRedirect :exec
INSERT INTO studio_redirects (source_id, target_id) VALUES ($1, $2);

-- name: UpdateStudioRedirects :exec
UPDATE studio_redirects SET target_id = @new_target_id WHERE target_id = @old_target_id;

-- name: DeleteStudioRedirect :exec
DELETE FROM studio_redirects WHERE source_id = $1;

-- name: FindStudioRedirect :one
SELECT target_id FROM studio_redirects WHERE source_id = $1;

-- name: FindStudioWithRedirect :one
SELECT S.* FROM studios S
WHERE S.id = $1 AND S.deleted = FALSE
UNION
SELECT SS.* FROM studio_redirects R
JOIN studios SS ON SS.id = R.target_id
WHERE R.source_id = $1 AND SS.deleted = FALSE;

-- name: FindStudioUrlsByIds :many
-- Get URLs for multiple studios
SELECT studio_id, url, site_id FROM studio_urls WHERE studio_id = ANY(sqlc.arg(studio_ids)::UUID[]);

-- name: FindStudioAliasesByIds :many
-- Get aliases for multiple studios
SELECT studio_id, alias FROM studio_aliases WHERE studio_id = ANY(sqlc.arg(studio_ids)::UUID[]);

-- name: FindStudioFavoritesByIds :many
-- Check favorite status for multiple studios for a specific user
SELECT studio_id, (studio_id IS NOT NULL)::BOOLEAN as is_favorite
FROM studio_favorites
WHERE studio_id = ANY(sqlc.arg(studio_ids)::UUID[]) AND user_id = sqlc.arg(user_id);

-- Studio favorites

-- name: CreateStudioFavorite :exec
INSERT INTO studio_favorites (studio_id, user_id, created_at) VALUES ($1, $2, NOW());

-- name: DeleteStudioFavorite :exec
DELETE FROM studio_favorites WHERE studio_id = $1 AND user_id = $2;

-- name: DeleteStudioFavorites :exec
DELETE FROM studio_favorites WHERE studio_id = $1;

-- name: ReassignStudioFavorites :exec
UPDATE studio_favorites
   SET studio_id = @new_studio_id
   WHERE studio_favorites.studio_id = @old_studio_id
   AND user_id NOT IN (
    SELECT user_id
    FROM studio_favorites SF
    WHERE SF.studio_id = @new_studio_id
  );
