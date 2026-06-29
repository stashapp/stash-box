-- Retain votes cast by deleted users so historical vote counts are preserved.
ALTER TABLE edit_votes DROP CONSTRAINT edit_votes_pkey;

ALTER TABLE edit_votes ALTER COLUMN user_id DROP NOT NULL;

CREATE UNIQUE INDEX edit_votes_edit_id_user_id_idx ON edit_votes (edit_id, user_id);

ALTER TABLE edit_votes
  DROP CONSTRAINT edit_votes_user_id_fkey,
  ADD CONSTRAINT edit_votes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
