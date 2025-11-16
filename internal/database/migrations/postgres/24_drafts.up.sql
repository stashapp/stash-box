CREATE TABLE "drafts" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "type" TEXT CHECK ("type" in ('SCENE', 'PERFORMER', 'STUDIO')) NOT NULL,
  "data" JSONB NOT NULL,
  "created_at" TIMESTAMP NOT NULL,
  FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);
