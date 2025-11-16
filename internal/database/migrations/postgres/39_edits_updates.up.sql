ALTER TABLE "edits"
ADD COLUMN "update_count" integer NOT NULL DEFAULT 0;

UPDATE "edits"
SET "update_count" = 1
WHERE "updated_at" IS NOT NULL;
