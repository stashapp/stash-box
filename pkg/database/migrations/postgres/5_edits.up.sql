CREATE TABLE "edits" (
  "id" uuid not null primary key,
  "user_id" uuid not null,
  "operation" varchar(10) not null,
  "target_type" varchar(10) not null,
  "data" jsonb,
  "edit_comment" text,
  "votes" integer not null default 0,
  "status" varchar(20) not null,
  "applied" boolean default FALSE not null,
  "created_at" timestamp not null,
  "updated_at" timestamp not null,
  foreign key("user_id") references "users"("id")
);

--CREATE TABLE "votes" (
--  "id" uuid not null primary key,
--  "user_id" not null uuid,
--  "edit_id" not null uuid,
--  "date" timestamp not null,
--  "comment" text,
--  "type" varchar(20) not null,
--  foreign key("user_id") references "users"("id"),
--  foreign key("edit_id") references "edits"("id")
--)

CREATE TABLE "performer_edit" (
  "edit_id" uuid not null,
  "performer_id" uuid not null,
  foreign key("edit_id") references "edits"("id"),
  foreign key("performer_id") references "performers"("id")
);

CREATE TABLE "studio_edit" (
  "edit_id" uuid not null,
  "studio_id" uuid not null,
  foreign key("edit_id") references "edits"("id"),
  foreign key("studio_id") references "studios"("id")
);

CREATE TABLE "tag_edit" (
  "edit_id" uuid not null,
  "tag_id" uuid not null,
  foreign key("edit_id") references "edits"("id"),
  foreign key("tag_id") references "tags"("id")
);

CREATE TABLE "scene_edit" (
  "edit_id" uuid not null,
  "scene_id" uuid not null,
  foreign key("edit_id") references "edits"("id"),
  foreign key("scene_id") references "scenes"("id")
);
