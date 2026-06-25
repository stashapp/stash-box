-- Non-partial keyset indexes for the entity changelog feed. Unlike the existing
-- partial (WHERE deleted = false) sort indexes, these must include deleted rows
-- so the changelog can report tombstones. Ordered (updated_at, id) ASC to match
-- the forward keyset scan; deleted is a payload column for index-only filtering.
CREATE INDEX scenes_updated_at_id_idx ON scenes (updated_at, id) INCLUDE (deleted);
CREATE INDEX performers_updated_at_id_idx ON performers (updated_at, id) INCLUDE (deleted);
CREATE INDEX studios_updated_at_id_idx ON studios (updated_at, id) INCLUDE (deleted);
CREATE INDEX tags_updated_at_id_idx ON tags (updated_at, id) INCLUDE (deleted);
