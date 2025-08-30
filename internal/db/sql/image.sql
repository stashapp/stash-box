-- Image queries

-- name: CreateImage :one
INSERT INTO images (id, url, width, height, checksum)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateImage :one
UPDATE images 
SET url = $2, width = $3, height = $4, checksum = $5
WHERE id = $1
RETURNING *;

-- name: DeleteImage :exec
DELETE FROM images WHERE id = $1;

-- name: FindImage :one
SELECT * FROM images WHERE id = $1;

-- name: FindImageByChecksum :one
SELECT * FROM images WHERE checksum = $1;

-- name: FindImagesBySceneID :many
SELECT images.* FROM images
LEFT JOIN scene_images as scenes_join on scenes_join.image_id = images.id
LEFT JOIN scenes on scenes_join.scene_id = scenes.id
WHERE scenes.id = $1;

-- name: FindImagesByStudioID :many
SELECT images.* FROM images
LEFT JOIN studio_images as studios_join on studios_join.image_id = images.id
LEFT JOIN studios on studios_join.studio_id = studios.id
WHERE studios.id = $1;

-- name: FindImagesByIds :many
SELECT * FROM images WHERE id = ANY($1::UUID[]);

-- name: FindUnusedImages :many
SELECT images.* from images
LEFT JOIN scene_images ON scene_images.image_id = images.id
LEFT JOIN performer_images ON performer_images.image_id = images.id
LEFT JOIN studio_images ON studio_images.image_id = images.id
LEFT JOIN (
    SELECT (jsonb_array_elements(data#>'{new_data,added_images}')->>0)::uuid AS image_id
    FROM edits
    WHERE status = 'PENDING'
) edit_images ON edit_images.image_id = images.id
LEFT JOIN (
    SELECT id, (data->>'image')::uuid AS image_id
    FROM drafts
) drafts ON images.id = drafts.image_id
WHERE scene_images.scene_id IS NULL
AND performer_images.performer_id IS NULL
AND studio_images.studio_id IS NULL
AND edit_images.image_id IS NULL
AND drafts.id IS NULL
LIMIT 1000;

-- name: IsImageUnused :one
SELECT COUNT(*) > 0 AS unused from images
LEFT JOIN scene_images ON scene_images.image_id = images.id
LEFT JOIN performer_images ON performer_images.image_id = images.id
LEFT JOIN studio_images ON studio_images.image_id = images.id
LEFT JOIN (
    SELECT (jsonb_array_elements(data#>'{new_data,added_images}')->>0)::uuid AS image_id
    FROM edits
    WHERE status = 'PENDING'
) edit_images ON edit_images.image_id = images.id
LEFT JOIN (
    SELECT id, (data->>'image')::uuid AS image_id
    FROM drafts
) drafts ON images.id = drafts.image_id
WHERE images.id = $1
AND scene_images.scene_id IS NULL
AND performer_images.performer_id IS NULL
AND studio_images.studio_id IS NULL
AND edit_images.image_id IS NULL
AND drafts.id IS NULL;

-- name: FindImageIdsBySceneIds :many
SELECT scene_images.scene_id, scene_images.image_id
FROM scene_images
WHERE scene_images.scene_id = ANY($1::UUID[]);

-- name: FindImageIdsByPerformerIds :many
SELECT performer_images.performer_id, performer_images.image_id
FROM performer_images
WHERE performer_images.performer_id = ANY($1::UUID[]);

-- name: FindImageIdsByStudioIds :many
SELECT studio_images.studio_id, studio_images.image_id
FROM studio_images
WHERE studio_images.studio_id = ANY($1::UUID[]);