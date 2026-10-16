-- Supports finding the edit which introduced an image. Image UUIDs are kept
-- in the edit payload, so index the exact JSON expression used by the lookup.
CREATE INDEX edits_added_images_gin_idx
ON edits USING GIN ((data#>'{new_data,added_images}') jsonb_path_ops);

CREATE INDEX edits_removed_images_gin_idx
ON edits USING GIN ((data#>'{new_data,removed_images}') jsonb_path_ops);

-- Existing relationship indexes lead with the owning entity id. Image detail
-- lookups and the moderation feed traverse these relationships in the reverse
-- direction, so give those predicates an index whose leading column is the
-- image id.
CREATE INDEX IF NOT EXISTS performer_images_image_id_idx
ON performer_images (image_id, performer_id);

CREATE INDEX IF NOT EXISTS scene_images_image_id_idx
ON scene_images (image_id, scene_id);

CREATE INDEX IF NOT EXISTS studio_images_image_id_idx
ON studio_images (image_id, studio_id);

-- Audit retention deletes rows globally by age. The per-image history index
-- starts with image_id and therefore cannot support that predicate.
CREATE INDEX IF NOT EXISTS image_audit_created_at_idx
ON image_audit (created_at);
