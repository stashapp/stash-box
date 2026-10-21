-- Compact references only in scene_fingerprints and scene_tags.
-- Public UUID primary keys and all other relationships remain unchanged.
-- Allow space for the replacement tables and indexes until commit.
BEGIN;

ALTER TABLE scenes ADD COLUMN internal_id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE;
ALTER TABLE users ADD COLUMN internal_id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE;
ALTER TABLE tags ADD COLUMN internal_id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE;

CREATE TABLE scene_fingerprints_internal (
  created_at timestamp NOT NULL DEFAULT now(),
  scene_id integer NOT NULL REFERENCES scenes(internal_id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(internal_id) ON DELETE CASCADE,
  fingerprint_id integer NOT NULL REFERENCES fingerprints(id) ON DELETE CASCADE,
  duration integer NOT NULL,
  vote smallint NOT NULL DEFAULT 1 CHECK (vote IN (-1, 1))
);

-- LEFT JOIN deliberately turns an unresolved reference into a NOT NULL
-- violation rather than silently discarding a submission.
INSERT INTO scene_fingerprints_internal (created_at, scene_id, user_id, fingerprint_id, duration, vote)
SELECT sf.created_at, s.internal_id, u.internal_id, sf.fingerprint_id, sf.duration, sf.vote
FROM scene_fingerprints sf
LEFT JOIN scenes s ON s.id = sf.scene_id
LEFT JOIN users u ON u.id = sf.user_id;

DROP MATERIALIZED VIEW scene_popularity_all_time;
DROP MATERIALIZED VIEW scene_popularity_trending;
DROP MATERIALIZED VIEW performer_popularity_all_time;
DROP TABLE scene_fingerprints;
ALTER TABLE scene_fingerprints_internal RENAME TO scene_fingerprints;

ALTER TABLE scene_fingerprints ADD CONSTRAINT scene_fingerprints_scene_user_fp_key
  UNIQUE (scene_id, user_id, fingerprint_id);
CREATE INDEX scene_fingerprints_fingerprint_idx ON scene_fingerprints(fingerprint_id);
CREATE INDEX scene_fingerprints_user_idx ON scene_fingerprints(user_id);
CREATE INDEX scene_fingerprints_created_brin ON scene_fingerprints USING brin(created_at)
  WITH (pages_per_range = 32);

CREATE TRIGGER scene_fingerprints_cleanup_orphans
AFTER DELETE ON scene_fingerprints
REFERENCING OLD TABLE AS deleted_rows
FOR EACH STATEMENT EXECUTE FUNCTION delete_orphan_fingerprints();

ALTER TABLE scene_fingerprints ALTER COLUMN user_id SET STATISTICS 1000;
ALTER TABLE scene_fingerprints SET (
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 2000
);

-- Popularity keeps its UUID interface. Aggregate on compact keys first.
CREATE MATERIALIZED VIEW scene_popularity_all_time AS
SELECT s.id AS scene_id, counts.user_count
FROM (
  SELECT scene_id, count(DISTINCT user_id)::integer AS user_count
  FROM scene_fingerprints GROUP BY scene_id
) counts JOIN scenes s ON s.internal_id = counts.scene_id;
CREATE UNIQUE INDEX scene_popularity_all_time_scene_id_idx ON scene_popularity_all_time(scene_id);
CREATE INDEX scene_popularity_all_time_count_idx ON scene_popularity_all_time(user_count DESC, scene_id DESC);

CREATE MATERIALIZED VIEW scene_popularity_trending AS
SELECT s.id AS scene_id, counts.trending_count
FROM (
  SELECT scene_id, count(DISTINCT user_id)::integer AS trending_count
  FROM scene_fingerprints
  WHERE created_at >= (now()::date - 7)
  GROUP BY scene_id
) counts JOIN scenes s ON s.internal_id = counts.scene_id;
CREATE UNIQUE INDEX scene_popularity_trending_scene_id_idx ON scene_popularity_trending(scene_id);
CREATE INDEX scene_popularity_trending_count_idx ON scene_popularity_trending(trending_count DESC, scene_id DESC);

CREATE MATERIALIZED VIEW performer_popularity_all_time AS
SELECT sp.performer_id, count(DISTINCT sf.user_id)::integer AS user_count
FROM scene_fingerprints sf
JOIN scenes s ON s.internal_id = sf.scene_id
JOIN scene_performers sp ON sp.scene_id = s.id
GROUP BY sp.performer_id;
CREATE UNIQUE INDEX performer_popularity_all_time_performer_id_idx ON performer_popularity_all_time(performer_id);
CREATE INDEX performer_popularity_all_time_count_idx ON performer_popularity_all_time(user_count DESC, performer_id DESC);

CREATE TABLE scene_tags_internal (
  scene_id integer NOT NULL REFERENCES scenes(internal_id) ON DELETE CASCADE,
  tag_id integer NOT NULL REFERENCES tags(internal_id) ON DELETE CASCADE
);
INSERT INTO scene_tags_internal (scene_id, tag_id)
SELECT s.internal_id, t.internal_id
FROM scene_tags st
LEFT JOIN scenes s ON s.id = st.scene_id
LEFT JOIN tags t ON t.id = st.tag_id;

DROP TABLE scene_tags;
ALTER TABLE scene_tags_internal RENAME TO scene_tags;
ALTER TABLE scene_tags ADD CONSTRAINT scene_tags_scene_id_tag_id_key UNIQUE (scene_id, tag_id);
CREATE INDEX scene_tags_tag_id_idx ON scene_tags(tag_id);

ANALYZE scenes, users, tags, scene_fingerprints, scene_tags;
COMMIT;
