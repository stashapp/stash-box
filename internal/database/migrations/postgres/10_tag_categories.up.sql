CREATE TABLE tag_categories (
  "id" uuid not null primary key,
  "group" text not null,
  "name" text not null,
  "description" text,
  "created_at" timestamp not null,
  "updated_at" timestamp not null,
  unique ("name")
);

ALTER TABLE tags
ADD COLUMN "category_id" uuid,
ADD FOREIGN KEY ("category_id") REFERENCES "tag_categories"("id");
