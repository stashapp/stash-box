-- User token queries

-- name: CreateUserToken :one
INSERT INTO user_tokens (id, data, type, created_at, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: DeleteUserToken :exec
DELETE FROM user_tokens WHERE id = $1;

-- name: DeleteExpiredUserTokens :exec
DELETE FROM user_tokens WHERE expires_at <= now();

-- name: FindUserToken :one
SELECT * FROM user_tokens WHERE id = $1;

-- name: FindUserTokensByInviteKey :many
SELECT * FROM user_tokens WHERE (data->>'invite_key')::UUID = $1::UUID;

-- name: FindUserTokensByEmail :many
SELECT * FROM user_tokens WHERE data->>'email' = $1::text;
