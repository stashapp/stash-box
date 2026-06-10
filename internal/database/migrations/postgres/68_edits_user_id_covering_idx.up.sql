DROP INDEX edits_user_id_idx;
CREATE INDEX edits_user_id_idx ON edits (user_id) INCLUDE (status, bot);
