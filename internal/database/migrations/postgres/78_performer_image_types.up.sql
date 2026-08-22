-- Type assignments belong to the entity-image relationship rather than to the
-- image: an images row is deduplicated by checksum and shared across performers,
-- scenes and studios, and can legitimately mean different things in each.
--
-- The composite foreign key is what makes removal correct. Dropping an image
-- from a performer must drop that performer's assignments for it while leaving
-- another performer's -- or a scene's -- assignments for the same image alone.
-- A foreign key to images(id) could not express that. Postgres requires a
-- unique constraint on the referenced columns, which migration 76 added.
CREATE TABLE performer_image_types (
  "performer_id" uuid NOT NULL,
  "image_id" uuid NOT NULL,
  "type_key" text NOT NULL REFERENCES "image_types"("key"),
  PRIMARY KEY ("performer_id", "image_id", "type_key"),
  FOREIGN KEY ("performer_id", "image_id")
    REFERENCES "performer_images"("performer_id", "image_id") ON DELETE CASCADE
);
