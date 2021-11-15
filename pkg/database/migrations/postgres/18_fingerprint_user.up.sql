DO $$
BEGIN
  IF current_setting('is_superuser') = 'on' THEN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  END IF;
END$$;

ALTER TABLE "scene_fingerprints" ADD COLUMN user_id uuid references "users"("id") ON DELETE CASCADE;

-- if there are existing fingerprints, create a user to assign them to it
DO $$
BEGIN
  IF EXISTS (SELECT FROM "scene_fingerprints") THEN
    WITH "rows" AS (
      INSERT INTO "users" 
        ("id", "name", "password_hash", "email", "api_key", "last_api_call", "created_at", "updated_at")
        VALUES
        (gen_random_uuid(), '_legacy_submissions', '', 'N/A', '', LOCALTIMESTAMP, LOCALTIMESTAMP, LOCALTIMESTAMP)
        RETURNING "id"
    ) UPDATE "scene_fingerprints" SET "user_id" = (SELECT "id" FROM "rows");
  END IF;
END$$;

ALTER TABLE "scene_fingerprints" ALTER COLUMN "user_id" SET NOT NULL;

ALTER TABLE "scene_fingerprints" DROP CONSTRAINT "scene_hash_unique";
ALTER TABLE "scene_fingerprints" ADD CONSTRAINT "scene_hash_unique" UNIQUE ("scene_id", "algorithm", "hash", "user_id"); 

CREATE INDEX "index_scene_fingerprints_on_hash" on "scene_fingerprints" ("algorithm", "hash");
CREATE INDEX "index_scene_fingerprints_on_user" on "scene_fingerprints" ("user_id", "algorithm", "hash");
CREATE INDEX "index_scene_fingerprints_on_created_at" on "scene_fingerprints" ("created_at");
