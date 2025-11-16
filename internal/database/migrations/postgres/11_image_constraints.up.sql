ALTER TABLE "scene_images"
DROP CONSTRAINT "scene_images_image_id_fkey",
DROP CONSTRAINT "scene_images_scene_id_fkey",
ADD CONSTRAINT "scene_images_image_id_fkey"
FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE,
ADD CONSTRAINT "scene_images_scene_id_fkey"
FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE;

ALTER TABLE "performer_images"
DROP CONSTRAINT "performer_images_image_id_fkey",
DROP CONSTRAINT "performer_images_performer_id_fkey",
ADD CONSTRAINT "performer_images_image_id_fkey"
FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE,
ADD CONSTRAINT "performer_images_performer_id_fkey"
FOREIGN KEY ("performer_id") REFERENCES "performers"("id") ON DELETE CASCADE;

ALTER TABLE "studio_images"
DROP CONSTRAINT "studio_images_image_id_fkey",
DROP CONSTRAINT "studio_images_studio_id_fkey",
ADD CONSTRAINT "studio_images_image_id_fkey"
FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE CASCADE,
ADD CONSTRAINT "studio_images_studio_id_fkey"
FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE;
