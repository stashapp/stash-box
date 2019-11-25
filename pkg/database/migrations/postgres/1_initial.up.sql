CREATE TABLE "performers" (
  "id" integer not null primary key generated always as identity,
  "image" bytea,
  "name" varchar(255) not null,
  "disambiguation" varchar(255),
  "gender" varchar(20),
  "birthdate" date,
  "birthdate_accuracy" varchar(10),
  "ethnicity" varchar(20),
  "country" varchar(255),
  "eye_color" varchar(10),
  "hair_color" varchar(10),
  "height" integer,
  "cup_size" varchar(5),
  "band_size" integer,
  "hip_size" integer,
  "waist_size" integer,
  "breast_type" varchar(10),
  "career_start_year" integer,
  "career_end_year" integer,
  "created_at" timestamp  not null,
  "updated_at" timestamp  not null
);

CREATE TABLE "performer_aliases" (
  "performer_id" integer not null,
  "alias" varchar(255) not null,
  foreign key("performer_id") references "performers"("id") ON DELETE CASCADE,
  unique ("performer_id", "alias")
);

CREATE TABLE "performer_urls" (
  "performer_id" integer not null,
  "url" varchar(255) not null,
  "type" varchar(255) not null,
  foreign key("performer_id") references "performers"("id") ON DELETE CASCADE,
  unique ("performer_id", "url"),
  unique ("performer_id", "type")
);

CREATE TABLE "performer_piercings" (
  "performer_id" integer not null,
  "location" varchar(255),
  "description" varchar(255),
  foreign key("performer_id") references "performers"("id") ON DELETE CASCADE,
  unique ("performer_id", "location")
);

CREATE TABLE "performer_tattoos" (
  "performer_id" integer not null,
  "location" varchar(255),
  "description" varchar(255),
  foreign key("performer_id") references "performers"("id") ON DELETE CASCADE,
  unique ("performer_id", "location")
);

CREATE INDEX "index_performers_on_name" on "performers" ("name");
CREATE INDEX "index_performers_on_alias" on "performer_aliases" ("alias");
CREATE INDEX "index_performers_on_piercing_location" on "performer_piercings" ("location");
CREATE INDEX "index_performers_on_tattoo_location" on "performer_tattoos" ("location");
CREATE INDEX "index_performers_on_tattoo_description" on "performer_tattoos" ("description");

CREATE TABLE "tags" (
  "id" integer not null primary key generated always as identity,
  "name" varchar(255) not null,
  "description" varchar(255),
  "created_at" timestamp  not null,
  "updated_at" timestamp  not null,
  unique ("name")
);

CREATE TABLE "tag_aliases" (
  "tag_id" integer not null,
  "alias" varchar(255) not null,
  foreign key("tag_id") references "tags"("id") ON DELETE CASCADE,
  unique ("alias")
);

CREATE TABLE "studios" (
  "id" integer not null primary key generated always as identity,
  "image" bytea,
  "name" varchar(255) not null,
  "parent_studio_id" integer ,
  "created_at" timestamp  not null,
  "updated_at" timestamp  not null,
  foreign key("parent_studio_id") references "studios"("id") ON DELETE CASCADE
);

CREATE TABLE "studio_urls" (
  "studio_id" integer not null,
  "url" varchar(255) not null,
  "type" varchar(255) not null,
  foreign key("studio_id") references "studios"("id") ON DELETE CASCADE,
  unique ("studio_id", "url"),
  unique ("studio_id", "type")
);

CREATE TABLE "scenes" (
  "id" integer not null primary key generated always as identity,
  "title" varchar(255),
  "details" varchar(255),
  "url" varchar(255),
  "date" date,
  "studio_id" integer,
  "created_at" timestamp  not null,
  "updated_at" timestamp  not null,
  foreign key("studio_id") references "studios"("id") ON DELETE SET NULL
);

CREATE TABLE "scene_fingerprints" (
  "scene_id" integer not null,
  "hash" varchar(255) not null,
  "algorithm" varchar(20) not null,
  foreign key("scene_id") references "scenes"("id") ON DELETE CASCADE,
  unique ("scene_id", "algorithm", "hash")
);

CREATE INDEX "index_scene_fingerprints_on_hash" on "scene_fingerprints" ("algorithm", "hash");

CREATE TABLE "scene_performers" (
  "scene_id" integer not null,
  "as" varchar(255),
  "performer_id" integer not null,
  foreign key("scene_id") references "scenes"("id") ON DELETE CASCADE,
  foreign key("performer_id") references "performers"("id") ON DELETE CASCADE,
  unique("scene_id", "performer_id")
);

CREATE TABLE "scene_tags" (
  "scene_id" integer not null,
  "tag_id" integer not null,
  foreign key("scene_id") references "scenes"("id") ON DELETE CASCADE,
  foreign key("tag_id") references "tags"("id") ON DELETE CASCADE,
  unique("scene_id", "tag_id")
);
