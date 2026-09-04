-- The uncropped bytes a cropped image was cut from, retained so a later
-- recrop can use a wider frame than whatever the current crop kept. Never
-- linked into scene_images/performer_images/studio_images, so it never
-- appears in a gallery -- it exists purely as backing material.
--
-- Self-referencing and nullable: most rows (URL-only images, and any image
-- with no crop history) have no original. ON DELETE SET NULL rather than
-- CASCADE -- ImageDestroy deletes by id unconditionally with no
-- unused-check, and a derived row must survive that, just falling back to
-- its own stored bytes the way every image behaved before this column
-- existed.
--
-- Always flat: an original's own original_image_id is always null, because
-- Recrop resolves the source's original rather than linking to the source
-- itself. Not expressible as a CHECK (would need a self-join), so this is an
-- invariant of the service layer, not the schema.
ALTER TABLE images ADD COLUMN "original_image_id" uuid REFERENCES images("id") ON DELETE SET NULL;
CREATE INDEX images_original_image_id_idx ON images (original_image_id);
