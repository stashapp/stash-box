-- Invite key queries

-- name: CreateInviteKey :one
INSERT INTO invite_keys (id, generated_by, generated_at, uses, expire_time)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: DeleteInviteKey :exec
DELETE FROM invite_keys WHERE id = $1;

-- name: FindInviteKey :one
SELECT * FROM invite_keys WHERE id = $1;

-- name: FindActiveKeysForUser :many
SELECT i.* FROM invite_keys i 
LEFT JOIN (
  SELECT uuid(data->>'invite_key') as invite_key, COUNT(*) as count
  FROM user_tokens
  WHERE type = 'NEW_USER' 
  GROUP BY data->>'invite_key'
) AS used ON used.invite_key = i.id
WHERE i.generated_by = $1 
AND (i.expire_time IS NULL OR i.expire_time > $2)
AND (i.uses IS NULL OR i.uses > coalesce(used.count, 0));

-- name: FindActiveInviteKeysForUser :many
SELECT i.* FROM invite_keys i
LEFT JOIN (
  SELECT uuid(data->>'invite_key') as invite_key, COUNT(*) as count
  FROM user_tokens
  WHERE expires_at > NOW()
  GROUP BY data->>'invite_key'
) AS used ON used.invite_key = i.id
WHERE i.generated_by = $1
AND (i.expire_time IS NULL OR i.expire_time > NOW())
AND (used.invite_key IS NULL OR i.uses IS NULL OR used.count < i.uses);

-- name: InviteKeyUsed :one
UPDATE invite_keys
SET uses = GREATEST(0, uses - 1)
WHERE id = $1 AND uses IS NOT NULL AND uses > 0
RETURNING uses;

-- name: DestroyExpiredInvites :exec
DELETE FROM invite_keys WHERE expire_time IS NOT NULL AND expire_time < NOW();