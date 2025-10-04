-- Site queries

-- name: CreateSite :one
INSERT INTO sites (id, name, description, url, regex, valid_types, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, now(), now())
RETURNING *;

-- name: UpdateSite :one
UPDATE sites 
SET name = $2, description = $3, url = $4, regex = $5, valid_types = $6, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteSite :exec
DELETE FROM sites WHERE id = $1;

-- name: GetSite :one
SELECT * FROM sites WHERE id = $1;

-- name: FindSitesByIds :many
SELECT * FROM sites WHERE id = ANY($1::UUID[]);
