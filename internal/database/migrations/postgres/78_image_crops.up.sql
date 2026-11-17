-- The uncropped bytes a cropped image was cut from, never linked into a gallery.
-- SET NULL so ImageDestroy's unconditional delete leaves a derived row on its own bytes.
-- Always flat: Recrop links to the source's original, never to the source.
ALTER TABLE images ADD COLUMN "original_image_id" uuid REFERENCES images("id") ON DELETE SET NULL;
CREATE INDEX images_original_image_id_idx ON images (original_image_id);
