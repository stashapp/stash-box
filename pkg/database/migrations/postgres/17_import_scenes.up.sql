CREATE TABLE "import_data" (
  "user_id" uuid not null,
  "row" integer not null,
  "data" jsonb,
  foreign key("user_id") references "users"("id") on delete cascade
);

CREATE UNIQUE INDEX "index_import_data_on_user_row" on "import_data" ("user_id", "row");
