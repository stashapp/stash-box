CREATE TABLE "studio_aliases" (
  "studio_id" uuid not null,
  "alias" varchar(255) not null,
  foreign key("studio_id") references "studios"("id") ON DELETE CASCADE,
  unique ("alias")
);