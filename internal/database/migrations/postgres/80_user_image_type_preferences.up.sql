-- A per-user reordering of the image types, applied server-side so existing
-- scraping clients benefit without a release. Paired with
-- user_image_type_group_preferences below, which orders the dimensions
-- themselves; this table only orders values inside one. No rows for a user
-- means no preference, which is the default for every existing user; unlike
-- user_notifications this table is deliberately not seeded.
--
-- No separate user_id index: the primary key's btree already leads with
-- user_id, so it serves every lookup the resolver makes. user_notifications
-- needs one only because it has no primary key at all.
CREATE TABLE user_image_type_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "type_key" text NOT NULL REFERENCES image_types("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "type_key")
);

-- Which dimension a user compares first, the same choice the admin makes
-- instance-wide. Separate from the type table rather than sharing one with a
-- discriminator: the keys come from different vocabularies and reference
-- different tables, so a single column could not carry both foreign keys.
--
-- This is the stronger of the two preferences -- group order decides which
-- dimension wins, type order only breaks ties inside one -- so withholding it
-- left preferences unable to express themselves at all whenever the dimension
-- someone cared about was compared last.
CREATE TABLE user_image_type_group_preferences (
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "group_key" text NOT NULL REFERENCES image_type_groups("key"),
  "sort_order" integer NOT NULL,
  PRIMARY KEY ("user_id", "group_key")
);
