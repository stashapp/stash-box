ALTER TABLE "edits"
ADD COLUMN "closed_at" timestamp;

ALTER TABLE "edits"
ALTER COLUMN "updated_at" DROP NOT NULL;

UPDATE "edits"
SET "closed_at" = "updated_at",
WHERE "updated_at" > "created_at"
AND "status" != 'PENDING';

UPDATE "edits"
SET "updated_at" = NULL; 
