ALTER TABLE "sites"
DROP CONSTRAINT IF EXISTS "sites_valid_types_check";
ALTER TABLE "sites"
ADD CONSTRAINT "sites_valid_types_check"
CHECK ("valid_types" <@ ARRAY['SCENE', 'PERFORMER', 'STUDIO', 'GALLERY']);

ALTER TABLE "drafts"
DROP CONSTRAINT IF EXISTS "drafts_type_check";
ALTER TABLE "drafts"
ADD CONSTRAINT "drafts_type_check"
CHECK ("type" IN ('SCENE', 'PERFORMER', 'STUDIO', 'GALLERY'));

CREATE TABLE "galleries" (
  "id" UUID PRIMARY KEY,
  "title" TEXT,
  "code" TEXT,
  "date" DATE,
  "photographer" TEXT,
  "details" TEXT,
  "studio_id" UUID REFERENCES "studios"("id") ON DELETE SET NULL,
  "cover_image_id" UUID REFERENCES "images"("id") ON DELETE SET NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "gallery_urls" (
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "site_id" UUID NOT NULL REFERENCES "sites"("id"),
  UNIQUE ("gallery_id", "url")
);

CREATE TABLE "gallery_performers" (
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
  "performer_id" UUID NOT NULL REFERENCES "performers"("id") ON DELETE CASCADE,
  "as" TEXT,
  UNIQUE ("gallery_id", "performer_id")
);

CREATE TABLE "gallery_tags" (
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
  "tag_id" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  UNIQUE ("gallery_id", "tag_id")
);

CREATE TABLE "gallery_scenes" (
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
  "scene_id" UUID NOT NULL REFERENCES "scenes"("id") ON DELETE CASCADE,
  UNIQUE ("gallery_id", "scene_id")
);

CREATE TABLE "gallery_images" (
  "id" UUID PRIMARY KEY,
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE,
  "index" INTEGER NOT NULL CHECK ("index" > 0),
  "phash" BIGINT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE ("gallery_id", "index") DEFERRABLE INITIALLY DEFERRED,
  UNIQUE ("gallery_id", "phash")
);

CREATE TABLE "gallery_image_tags" (
  "gallery_image_id" UUID NOT NULL REFERENCES "gallery_images"("id") ON DELETE CASCADE,
  "tag_id" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  UNIQUE ("gallery_image_id", "tag_id")
);

CREATE TABLE "gallery_edits" (
  "edit_id" UUID PRIMARY KEY REFERENCES "edits"("id") ON DELETE CASCADE,
  "gallery_id" UUID NOT NULL REFERENCES "galleries"("id") ON DELETE CASCADE
);

CREATE INDEX "galleries_studio_idx" ON "galleries" ("studio_id");
CREATE INDEX "galleries_active_title_idx" ON "galleries" ("title", "id") WHERE "deleted" = FALSE;
CREATE INDEX "galleries_active_code_idx" ON "galleries" ("code", "id") WHERE "deleted" = FALSE;

CREATE INDEX "gallery_urls_url_lower_idx" ON "gallery_urls" (LOWER("url"));
CREATE INDEX "gallery_urls_site_idx" ON "gallery_urls" ("site_id");
CREATE INDEX "gallery_performers_performer_idx" ON "gallery_performers" ("performer_id");
CREATE INDEX "gallery_tags_tag_idx" ON "gallery_tags" ("tag_id");
CREATE INDEX "gallery_scenes_scene_idx" ON "gallery_scenes" ("scene_id");
CREATE INDEX "gallery_scenes_gallery_idx" ON "gallery_scenes" ("gallery_id");
CREATE INDEX "gallery_images_phash_idx" ON "gallery_images" ("phash");
CREATE INDEX "gallery_image_tags_tag_idx" ON "gallery_image_tags" ("tag_id");
CREATE INDEX "gallery_edits_gallery_idx" ON "gallery_edits" ("gallery_id");
-- The custom Hamming index is deliberately optional, matching scene phash
-- support. Exact phash lookups always use gallery_images_phash_idx.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'bktree') THEN
    CREATE INDEX "gallery_images_phash_bktree_idx"
    ON "gallery_images"
    USING spgist ("phash" bktree_ops);
  END IF;
END$$;
