-- Site category queries

-- name: CreateSiteCategory :one
INSERT INTO site_categories (id, name, description, sort_order, created_at, updated_at)
VALUES ($1, $2, $3, $4, now(), now())
RETURNING *;

-- name: UpdateSiteCategory :one
UPDATE site_categories
SET name = $2, description = $3, sort_order = $4, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteSiteCategory :exec
DELETE FROM site_categories WHERE id = $1;

-- name: FindSiteCategory :one
SELECT * FROM site_categories WHERE id = $1;

-- name: GetAllSiteCategories :many
SELECT * FROM site_categories ORDER BY sort_order ASC, name ASC;

-- name: GetSiteCategoriesByIds :many
SELECT * FROM site_categories WHERE id = ANY($1::UUID[]);
