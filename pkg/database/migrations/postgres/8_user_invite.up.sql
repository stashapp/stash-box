ALTER TABLE "users"
  ADD COLUMN "invited_by" uuid,
  ADD COLUMN "invite_tokens" integer not null default 0,
  ADD foreign key("invited_by") references "users"("id") ON DELETE SET NULL;

CREATE INDEX "user_invited_by_idx" ON "users" ("invited_by");

CREATE TABLE "invite_keys" (
  "id" uuid not null primary key,
  "generated_by" uuid not null,
  "generated_at" timestamp not null,
  foreign key("generated_by") references "users"("id") on delete cascade
);

CREATE INDEX "invite_keys_generated_by_idx" ON "invite_keys" ("generated_by");

CREATE TABLE "pending_activations" (
  "id" uuid not null primary key,
  "email" varchar(255) not null,
  "invite_key" uuid,
  "type" varchar(255) not null,
  "time" timestamp not null,
  foreign key("invite_key") references "invite_keys"("id")
);

CREATE INDEX "pending_activation_email_idx" on "pending_activations" ("email");
CREATE INDEX "pending_activation_invite_key_idx" on "pending_activations" ("invite_key");
