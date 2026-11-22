-- Gallery queries

-- name: CreateGallery :one
INSERT INTO galleries (id, title, code, date, photographer, details, studio_id, cover_image_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
RETURNING *;

-- name: UpdateGallery :one
UPDATE galleries
SET title = $2, code = $3, date = $4, photographer = $5, details = $6,
    studio_id = $7, cover_image_id = $8, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: FindGallery :one
SELECT * FROM galleries WHERE id = $1;

-- name: GetGalleries :many
SELECT * FROM galleries WHERE id = ANY($1::UUID[]) AND deleted = FALSE;

-- name: DeleteGallery :exec
DELETE FROM galleries WHERE id = $1;

-- name: SoftDeleteGallery :one
UPDATE galleries SET deleted = TRUE, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: RestoreGallery :one
UPDATE galleries SET deleted = FALSE, updated_at = NOW() WHERE id = $1
RETURNING *;

-- Gallery URLs

-- name: DeleteGalleryURLs :exec
DELETE FROM gallery_urls WHERE gallery_id = $1;

-- name: CreateGalleryURLs :copyfrom
INSERT INTO gallery_urls (gallery_id, url, site_id) VALUES ($1, $2, $3);

-- name: GetGalleryURLs :many
SELECT * FROM gallery_urls WHERE gallery_id = $1 ORDER BY url;

-- name: FindGalleryUrlsByIds :many
SELECT * FROM gallery_urls WHERE gallery_id = ANY(sqlc.arg(gallery_ids)::UUID[]) ORDER BY gallery_id, url;

-- Gallery performers

-- name: DeleteGalleryPerformers :exec
DELETE FROM gallery_performers WHERE gallery_id = $1;

-- name: CreateGalleryPerformers :copyfrom
INSERT INTO gallery_performers (gallery_id, performer_id, "as") VALUES ($1, $2, $3);

-- name: GetGalleryPerformers :many
SELECT sqlc.embed(P), "as"
FROM gallery_performers GP
JOIN performers P ON P.id = GP.performer_id
WHERE GP.gallery_id = $1
ORDER BY P.name;

-- name: FindGalleryPerformersByIds :many
SELECT gallery_id, performer_id, "as"
FROM gallery_performers
WHERE gallery_id = ANY(sqlc.arg(gallery_ids)::UUID[]);

-- Gallery tags

-- name: DeleteGalleryTags :exec
DELETE FROM gallery_tags WHERE gallery_id = $1;

-- name: CreateGalleryTags :copyfrom
INSERT INTO gallery_tags (gallery_id, tag_id) VALUES ($1, $2);

-- name: GetGalleryTags :many
SELECT T.* FROM gallery_tags GT JOIN tags T ON T.id = GT.tag_id
WHERE GT.gallery_id = $1
ORDER BY T.name;

-- Gallery scenes

-- name: DeleteGalleryScenes :exec
DELETE FROM gallery_scenes WHERE gallery_id = $1;

-- name: CreateGalleryScenes :copyfrom
INSERT INTO gallery_scenes (gallery_id, scene_id) VALUES ($1, $2);

-- name: GetGalleryScenes :many
SELECT S.* FROM gallery_scenes GS JOIN scenes S ON S.id = GS.scene_id
WHERE GS.gallery_id = $1
ORDER BY S.title, S.id;

-- Gallery images

-- name: CountGalleryImages :one
SELECT COUNT(*)::INT FROM gallery_images WHERE gallery_id = $1;

-- name: CreateGalleryImage :one
INSERT INTO gallery_images (id, gallery_id, "index", phash, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING *;

-- name: FindGalleryImage :one
SELECT * FROM gallery_images WHERE id = $1;

-- name: GetGalleryImages :many
SELECT * FROM gallery_images WHERE gallery_id = $1 ORDER BY "index";

-- name: FindGalleryImageByPHash :one
SELECT * FROM gallery_images WHERE gallery_id = $1 AND phash = $2;

-- name: DeleteGalleryImage :execrows
DELETE FROM gallery_images WHERE id = $1;

-- name: DeleteGalleryImages :exec
DELETE FROM gallery_images WHERE gallery_id = $1;

-- name: SetGalleryImageIndex :one
UPDATE gallery_images SET "index" = $2, updated_at = NOW() WHERE id = $1
RETURNING *;

-- name: ReplaceGalleryImagePHash :one
UPDATE gallery_images
SET phash = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: ReindexGalleryImages :exec
WITH ordered AS (
  SELECT SOURCE.id, ROW_NUMBER() OVER (ORDER BY SOURCE."index", SOURCE.id)::INTEGER AS new_index
  FROM gallery_images SOURCE
  WHERE SOURCE.gallery_id = $1
)
UPDATE gallery_images GI
SET "index" = ordered.new_index, updated_at = NOW()
FROM ordered
WHERE GI.id = ordered.id AND GI."index" <> ordered.new_index;

-- Gallery image tags

-- name: DeleteGalleryImageTags :exec
DELETE FROM gallery_image_tags WHERE gallery_image_id = $1;

-- name: CreateGalleryImageTag :exec
INSERT INTO gallery_image_tags (gallery_image_id, tag_id)
VALUES ($1, $2);

-- name: GetGalleryImageTags :many
SELECT * FROM gallery_image_tags
WHERE gallery_image_id = $1
ORDER BY tag_id;

-- Relationship cleanup and merge helpers

-- name: DeleteGalleryPerformersByPerformer :exec
DELETE FROM gallery_performers WHERE performer_id = $1;

-- name: SetGalleryPerformerAlias :exec
UPDATE gallery_performers
SET "as" = @alias
WHERE performer_id = @performer_id
AND ("as" IS NULL OR "as" = '');

-- name: ClearGalleryPerformerAlias :exec
UPDATE gallery_performers
SET "as" = NULL
WHERE performer_id = @performer_id
AND "as" = @alias;

-- name: UpdateGalleryPerformersForMerge :exec
UPDATE gallery_performers
SET performer_id = @new_performer_id
WHERE gallery_performers.performer_id = @old_performer_id
AND NOT EXISTS (
  SELECT 1
  FROM gallery_performers existing
  WHERE existing.gallery_id = gallery_performers.gallery_id
  AND existing.performer_id = @new_performer_id
);

-- name: DeleteGalleryStudios :exec
UPDATE galleries SET studio_id = NULL WHERE studio_id = $1;

-- name: UpdateGalleryStudiosForMerge :exec
UPDATE galleries SET studio_id = @new_studio_id WHERE studio_id = @old_studio_id;

-- name: DeleteGalleryTagsByTag :exec
DELETE FROM gallery_tags WHERE tag_id = $1;

-- name: UpdateGalleryTagsForMerge :exec
UPDATE gallery_tags
SET tag_id = @new_tag_id
WHERE gallery_tags.tag_id = @old_tag_id
AND NOT EXISTS (
  SELECT 1
  FROM gallery_tags existing
  WHERE existing.gallery_id = gallery_tags.gallery_id
  AND existing.tag_id = @new_tag_id
);

-- name: DeleteGalleryImageTagsByTag :exec
DELETE FROM gallery_image_tags WHERE tag_id = $1;

-- name: UpdateGalleryImageTagsForMerge :exec
UPDATE gallery_image_tags
SET tag_id = @new_tag_id
WHERE gallery_image_tags.tag_id = @old_tag_id
AND NOT EXISTS (
  SELECT 1
  FROM gallery_image_tags existing
  WHERE existing.gallery_image_id = gallery_image_tags.gallery_image_id
  AND existing.tag_id = @new_tag_id
);

-- name: DeleteGalleryScenesByScene :exec
DELETE FROM gallery_scenes WHERE scene_id = $1;

-- name: UpdateGalleryScenesForMerge :exec
UPDATE gallery_scenes
SET scene_id = @new_scene_id
WHERE gallery_scenes.scene_id = @old_scene_id
AND NOT EXISTS (
  SELECT 1
  FROM gallery_scenes existing
  WHERE existing.gallery_id = gallery_scenes.gallery_id
  AND existing.scene_id = @new_scene_id
);

