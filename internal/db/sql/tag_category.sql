-- Tag category queries

-- name: CreateTagCategory :one
INSERT INTO tag_categories (id, "group", name, description, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateTagCategory :one
UPDATE tag_categories 
SET "group" = $2, name = $3, description = $4, updated_at = $5
WHERE id = $1
RETURNING *;

-- name: DeleteTagCategory :exec
DELETE FROM tag_categories WHERE id = $1;

-- name: FindTagCategory :one
SELECT * FROM tag_categories WHERE id = $1;

-- name: GetAllTagCategories :many
SELECT * FROM tag_categories ORDER BY name ASC;

-- name: GetTagCategoriesByIds :many
SELECT * FROM tag_categories WHERE id = ANY($1::UUID[]);