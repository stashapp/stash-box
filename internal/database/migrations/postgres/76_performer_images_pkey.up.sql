-- Migration 04 created performer_images with bare FK columns and migration 11
-- only replaced the FKs, so duplicate (performer_id, image_id) rows are possible
-- in deployed databases. Remove them before adding the key; ctid is the only way
-- to distinguish two otherwise identical rows.
DELETE FROM performer_images pi
WHERE pi.ctid <> (
  SELECT min(pi2.ctid) FROM performer_images pi2
  WHERE pi2.performer_id = pi.performer_id AND pi2.image_id = pi.image_id
);

ALTER TABLE performer_images
ADD CONSTRAINT performer_images_pkey PRIMARY KEY (performer_id, image_id);

-- Redundant now that the primary key's btree leads with performer_id
DROP INDEX performer_images_performer_id_idx;
