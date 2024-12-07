DROP TABLE "pending_activations";

CREATE TABLE "user_tokens" (
  "id" UUID NOT NULL,
  "data" JSONB,
  "type" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "expires_at" TIMESTAMP NOT NULL
);
