-- User queries

-- name: CreateUser :one
INSERT INTO users (id, name, password_hash, email, api_key, api_calls, invite_tokens, invited_by, last_api_call, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
RETURNING *;

-- name: UpdateUser :one
UPDATE users 
SET name = $2, password_hash = $3, email = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE id = $1;

-- name: FindUser :one
SELECT * FROM users WHERE id = $1;

-- name: FindUserByName :one
SELECT * FROM users WHERE UPPER(name) = UPPER(sqlc.arg(name)::text);

-- name: FindUserByEmail :one
SELECT * FROM users WHERE UPPER(email) = UPPER($1);

-- name: CountUsers :one
SELECT COUNT(*) FROM users;

-- name: UpdateUserAPIKey :exec
UPDATE users
SET api_key = $2, updated_at = NOW()
WHERE id = $1;

-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash = $2, updated_at = NOW()
WHERE id = $1;

-- name: UpdateUserInviteTokenCount :exec
UPDATE users
SET invite_tokens = $2
WHERE id = $1;

-- name: UpdateUserEmail :exec
UPDATE users
SET email = $2, updated_at = NOW()
WHERE id = $1;

-- User roles

-- name: CreateUserRoles :copyfrom
INSERT INTO user_roles (user_id, role) VALUES ($1, $2);

-- name: DeleteUserRoles :exec
DELETE FROM user_roles WHERE user_id = $1;

-- name: GetUserRoles :many
SELECT role FROM user_roles WHERE user_id = $1;

-- name: CountVotesByType :many
SELECT vote, COUNT(*) as count FROM edit_votes WHERE user_id = $1 GROUP BY vote;

-- name: CountUserEditsByStatus :many
SELECT status, COUNT(*) as count FROM edits WHERE user_id = $1 GROUP BY status;

-- name: GetUserNotificationSubscriptions :many
SELECT type FROM user_notifications WHERE user_id = $1;
