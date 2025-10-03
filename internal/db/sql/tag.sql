-- Tag queries

-- name: CreateTag :one
INSERT INTO tags (id, name, category_id, description, created_at, updated_at, deleted)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateTag :one
UPDATE tags 
SET name = $2, category_id = $3, description = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateTagPartial :one
UPDATE tags 
SET name = COALESCE(sqlc.narg('name'), name),
    category_id = COALESCE(sqlc.narg('category_id'), category_id),
    description = COALESCE(sqlc.narg('description'), description),
    updated_at = $2,
    deleted = COALESCE(sqlc.narg('deleted'), deleted)
WHERE id = $1
RETURNING *;

-- name: DeleteTag :exec
DELETE FROM tags WHERE id = $1;

-- name: SoftDeleteTag :one
UPDATE tags SET deleted = true, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: FindTag :one
SELECT * FROM tags WHERE id = $1;

-- name: FindTagByName :one
SELECT * FROM tags WHERE UPPER(name) = UPPER($1) AND deleted = false;

-- name: SearchTags :many
SELECT T.* FROM tags T
LEFT JOIN tag_aliases TA ON TA.tag_id = T.id
WHERE (
    to_tsvector('english', T.name) ||
    to_tsvector('english', COALESCE(TA.alias, ''))
) @@ plainto_tsquery(sqlc.narg('term'))
AND T.deleted = FALSE
GROUP BY T.id
ORDER BY T.name ASC
LIMIT sqlc.arg('limit');

-- name: CountTags :one
SELECT COUNT(*) FROM tags WHERE deleted = false;

-- name: GetAllTags :many
SELECT * FROM tags WHERE deleted = false ORDER BY name;

-- name: GetTags :many
SELECT * FROM tags WHERE id = ANY($1::UUID[]) ORDER BY name;

-- name: FindTagsByIds :many
SELECT * FROM tags WHERE id = ANY($1::UUID[]);

-- Tag aliases

-- name: CreateTagAlias :exec
INSERT INTO tag_aliases (tag_id, alias) VALUES ($1, $2);

-- name: CreateTagAliases :copyfrom
INSERT INTO tag_aliases (tag_id, alias) VALUES ($1, $2);

-- name: DeleteTagAliases :exec
DELETE FROM tag_aliases WHERE tag_id = $1;

-- name: DeleteTagAliasesByNames :exec
DELETE FROM tag_aliases WHERE tag_id = $1 AND alias = ANY($2::TEXT[]);

-- name: GetTagAliases :many
SELECT alias FROM tag_aliases WHERE tag_id = $1;

-- name: FindTagByAlias :one
SELECT t.* FROM tags t
JOIN tag_aliases ta ON t.id = ta.tag_id
WHERE UPPER(ta.alias) = UPPER($1) AND t.deleted = false;

-- name: FindTagByNameOrAlias :one
SELECT T.* FROM tags T
LEFT JOIN tag_aliases TA ON T.id = TA.tag_id
WHERE (
  LOWER(TA.alias) = LOWER($1)
  OR LOWER(T.name) = LOWER($1)
) AND T.deleted = FALSE;

-- Tag redirects

-- name: CreateTagRedirect :exec
INSERT INTO tag_redirects (source_id, target_id) VALUES ($1, $2);

-- name: UpdateTagRedirects :exec
UPDATE tag_redirects SET target_id = @new_target_id WHERE target_id = @old_target_id;

-- name: DeleteTagRedirect :exec
DELETE FROM tag_redirects WHERE source_id = $1;

-- name: FindTagRedirect :one
SELECT target_id FROM tag_redirects WHERE source_id = $1;

-- name: FindTagsWithRedirects :many
SELECT DISTINCT * FROM (
    SELECT T.* FROM tags T
    WHERE T.id = ANY($1::UUID[]) AND T.deleted = FALSE
    UNION
    SELECT TT.* FROM tag_redirects R
    JOIN tags TT ON TT.id = R.target_id
    WHERE R.source_id = ANY($1::UUID[]) AND TT.deleted = FALSE
) AS combined_tags;

-- Scene tags management

-- name: CreateSceneTag :exec
INSERT INTO scene_tags (scene_id, tag_id) VALUES ($1, $2);

-- name: CreateSceneTags :copyfrom
INSERT INTO scene_tags (scene_id, tag_id) VALUES ($1, $2);

-- name: DeleteSceneTagsByTag :exec
DELETE FROM scene_tags WHERE tag_id = $1;

-- name: DeleteSceneTagsByScene :exec
DELETE FROM scene_tags WHERE scene_id = $1;

-- name: GetSceneTags :many
SELECT T.* FROM scene_tags ST JOIN tags T ON ST.tag_id = T.id WHERE scene_id = $1;

-- name: GetTagScenes :many
SELECT scene_id FROM scene_tags WHERE tag_id = $1;

-- name: FindTagsBySceneID :many
SELECT t.* FROM tags t
INNER JOIN scene_tags st ON st.tag_id = t.id
WHERE st.scene_id = $1 AND t.deleted = false;

-- name: UpdateSceneTagsForMerge :exec
UPDATE scene_tags
SET tag_id = @new_tag_id
WHERE scene_tags.tag_id = @old_tag_id
AND scene_id NOT IN (SELECT scene_id from scene_tags st WHERE st.tag_id = @new_tag_id);

-- name: FindTagIdsBySceneIds :many
-- Bulk query to find tag IDs for multiple scene IDs
SELECT scene_id, tag_id FROM scene_tags WHERE scene_id = ANY(sqlc.arg(scene_ids)::UUID[]);

-- Complex tag queries would require dynamic SQL for:
-- - Text search with fuzzy matching
-- - Category filtering
-- - Usage count calculations  
-- - Hierarchical category traversal
-- - Performance optimization for large tag sets
-- These are better handled by the existing query builder patterns
