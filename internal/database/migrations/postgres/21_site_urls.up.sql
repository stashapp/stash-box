CREATE TABLE "sites" (
  "id" UUID NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT,
  "regex" TEXT,
  "valid_types" TEXT[] CHECK ("valid_types" <@ ARRAY['SCENE', 'PERFORMER', 'STUDIO']) NOT NULL,
  "created_at" TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP NOT NULL,
  UNIQUE ("name")
);

INSERT INTO "sites" (
  "id",
  "name",
  "valid_types",
  "created_at",
  "updated_at"
) VALUES (
  '96d68ff6-cd18-4277-8633-5119abbdb635',
  'Studio',
  ARRAY['SCENE'],
  NOW(),
  NOW()
);

INSERT INTO "sites" (
  "id",
  "name",
  "valid_types",
  "created_at",
  "updated_at"
) VALUES (
  '1cda874a-bab4-44d8-b32b-c1e485e66b6f',
  'Home',
  ARRAY['STUDIO'],
  NOW(),
  NOW()
);

UPDATE "scene_urls" SET "type" = '96d68ff6-cd18-4277-8633-5119abbdb635' WHERE type = 'STUDIO';
UPDATE "studio_urls" SET "type" = '1cda874a-bab4-44d8-b32b-c1e485e66b6f' WHERE type = 'HOME';

ALTER TABLE "scene_urls" ALTER COLUMN "type" TYPE UUID USING type::uuid;
ALTER TABLE "scene_urls" RENAME "type" TO "site_id";
ALTER TABLE "scene_urls"
DROP CONSTRAINT IF EXISTS "scene_urls_scene_id_type_key";
ALTER TABLE "scene_urls"
ADD CONSTRAINT "scene_urls_site_id_fkey"
  FOREIGN KEY ("site_id")
  REFERENCES "sites"("id");

ALTER TABLE "studio_urls" ALTER COLUMN "type" TYPE UUID USING type::uuid;
ALTER TABLE "studio_urls" RENAME "type" TO "site_id";
ALTER TABLE "studio_urls"
DROP CONSTRAINT IF EXISTS "studio_urls_studio_id_type_key";
ALTER TABLE "studio_urls"
  ADD CONSTRAINT "studio_urls_site_id_fkey"
    FOREIGN KEY ("site_id")
    REFERENCES "sites"("id");

ALTER TABLE "performer_urls" ALTER COLUMN "type" TYPE UUID USING type::uuid;
ALTER TABLE "performer_urls" RENAME "type" TO "site_id";
ALTER TABLE "performer_urls"
DROP CONSTRAINT IF EXISTS "performer_urls_performer_id_type_key";
ALTER TABLE "performer_urls"
  ADD CONSTRAINT "performer_urls_site_id_fkey"
    FOREIGN KEY ("site_id")
    REFERENCES "sites"("id");
