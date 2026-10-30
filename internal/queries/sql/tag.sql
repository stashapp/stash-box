-- Tag queries

-- name: CreateTag :one
INSERT INTO tags (id, name, category_id, description, created_at, updated_at)
VALUES ($1, $2, $3, $4, now(), now())
RETURNING *;

-- name: UpdateTag :one
UPDATE tags 
SET name = $2, category_id = $3, description = $4, updated_at = NOW()
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
JOIN tag_search TS ON TS.tag_id = T.id
WHERE TS.tag_id @@@ paradedb.boolean(should => ARRAY[
    paradedb.match(field => 'name', value => sqlc.narg('term')::TEXT, distance => 1, prefix => true, conjunction_mode => true),
    paradedb.match(field => 'aliases', value => sqlc.narg('term')::TEXT, distance => 1, prefix => true, conjunction_mode => true)
])
AND T.deleted = FALSE
ORDER BY pdb.score(TS.tag_id) DESC
LIMIT sqlc.arg('limit');

-- name: FindTagsByIds :many
SELECT * FROM tags WHERE id = ANY($1::UUID[]);

-- Tag aliases

-- name: CreateTagAliases :copyfrom
INSERT INTO tag_aliases (tag_id, alias) VALUES ($1, $2);

-- name: DeleteTagAliases :exec
DELETE FROM tag_aliases WHERE tag_id = $1;

-- name: DeleteTagAliasesByNames :exec
DELETE FROM tag_aliases WHERE tag_id = $1 AND alias = ANY($2::TEXT[]);

-- name: GetTagAliases :many
SELECT alias FROM tag_aliases WHERE tag_id = $1;

-- name: FindTagAliasesByIds :many
-- Get aliases for multiple tags
SELECT tag_id, alias FROM tag_aliases WHERE tag_id = ANY(sqlc.arg(tag_ids)::UUID[]);

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

-- name: FindTagWithRedirect :many
SELECT T.* FROM tags T
WHERE T.id = $1 AND T.deleted = FALSE
UNION
SELECT TT.* FROM tag_redirects R
JOIN tags TT ON TT.id = R.target_id
WHERE R.source_id = $1 AND TT.deleted = FALSE;

-- Scene tags management

-- name: InsertSceneTags :execrows
INSERT INTO scene_tags (scene_id, tag_id)
SELECT s.internal_id, t.internal_id
FROM (
    SELECT unnest(sqlc.arg(scene_ids)::uuid[]) AS scene_id,
           unnest(sqlc.arg(tag_ids)::uuid[]) AS tag_id
) input
LEFT JOIN scenes s ON s.id = input.scene_id
LEFT JOIN tags t ON t.id = input.tag_id;

-- name: DeleteSceneTagsByTag :exec
DELETE FROM scene_tags WHERE tag_id = (SELECT internal_id FROM tags WHERE id = sqlc.arg(tag_id)::uuid);

-- name: DeleteSceneTagsByScene :exec
DELETE FROM scene_tags WHERE scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: GetSceneTags :many
SELECT T.* FROM scene_tags ST JOIN tags T ON ST.tag_id = T.internal_id
WHERE scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: FindTagsBySceneID :many
SELECT t.* FROM tags t
INNER JOIN scene_tags st ON st.tag_id = t.internal_id
WHERE st.scene_id = (SELECT internal_id FROM scenes WHERE id = sqlc.arg(scene_id)::uuid);

-- name: UpdateSceneTagsForMerge :exec
UPDATE scene_tags
SET tag_id = (SELECT internal_id FROM tags WHERE id = sqlc.arg(new_tag_id)::uuid)
WHERE scene_tags.tag_id = (SELECT internal_id FROM tags WHERE id = sqlc.arg(old_tag_id)::uuid)
AND scene_id NOT IN (SELECT scene_id FROM scene_tags st
    WHERE st.tag_id = (SELECT internal_id FROM tags WHERE id = sqlc.arg(new_tag_id)::uuid));

-- name: FindTagIdsBySceneIds :many
-- Bulk query to find tag IDs for multiple scene IDs
SELECT s.id AS scene_id, t.id AS tag_id FROM scene_tags st
JOIN scenes s ON s.internal_id = st.scene_id
JOIN tags t ON t.internal_id = st.tag_id
WHERE s.id = ANY(sqlc.arg(scene_ids)::UUID[]);
