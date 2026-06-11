CREATE TABLE site_categories (
  "id" uuid not null primary key,
  "name" text not null,
  "description" text,
  "sort_order" integer not null default 0,
  "created_at" timestamp not null,
  "updated_at" timestamp not null,
  unique ("name")
);

ALTER TABLE sites
ADD COLUMN "category_id" uuid,
ADD FOREIGN KEY ("category_id") REFERENCES "site_categories"("id") ON DELETE SET NULL;
