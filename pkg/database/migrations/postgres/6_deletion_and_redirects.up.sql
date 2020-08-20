ALTER TABLE tags ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE performers ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE scenes ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE studios ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tags DROP CONSTRAINT "tags_name_key";
CREATE UNIQUE INDEX "index_active_tags_on_name" on "tags" ("name") WHERE NOT "deleted";
DROP INDEX "index_performers_on_name";
CREATE UNIQUE INDEX "index_active_performers_on_name" on "performers" ("name", "disambiguation") WHERE NOT "deleted";

CREATE TABLE "tag_redirects" (
  "source_id" UUID NOT NULL,
  "target_id" UUID NOT NULL,
  FOREIGN KEY("source_id") REFERENCES "tags"("id") ON DELETE CASCADE,
  FOREIGN KEY("target_id") REFERENCES "tags"("id") ON DELETE CASCADE,
  PRIMARY KEY ("source_id")
);

CREATE TABLE "performer_redirects" (
  "source_id" UUID NOT NULL,
  "target_id" UUID NOT NULL,
  FOREIGN KEY("source_id") REFERENCES "performers"("id") ON DELETE CASCADE,
  FOREIGN KEY("target_id") REFERENCES "performers"("id") ON DELETE CASCADE,
  PRIMARY KEY ("source_id")
);

CREATE TABLE "scene_redirects" (
  "source_id" UUID NOT NULL,
  "target_id" UUID NOT NULL,
  FOREIGN KEY("source_id") REFERENCES "scenes"("id") ON DELETE CASCADE,
  FOREIGN KEY("target_id") REFERENCES "scenes"("id") ON DELETE CASCADE,
  PRIMARY KEY ("source_id")
);

CREATE TABLE "studio_redirects" (
  "source_id" UUID NOT NULL,
  "target_id" UUID NOT NULL,
  FOREIGN KEY("source_id") REFERENCES "studios"("id") ON DELETE CASCADE,
  FOREIGN KEY("target_id") REFERENCES "studios"("id") ON DELETE CASCADE,
  PRIMARY KEY ("source_id")
);
