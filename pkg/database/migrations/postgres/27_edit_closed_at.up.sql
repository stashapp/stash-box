ALTER TABLE "edits"
ADD COLUMN "closed_at" timestamp;

ALTER TABLE "edits"
ALTER COLUMN "updated_at" DROP NOT NULL;
