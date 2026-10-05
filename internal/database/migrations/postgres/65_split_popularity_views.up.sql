-- Split combined popularity matviews into all_time + trending, so the hourly
-- cron only refreshes the cheap trending slice while all_time moves to daily.

DROP MATERIALIZED VIEW scene_popularity;
DROP MATERIALIZED VIEW performer_popularity;

-- BRIN on created_at: trending refresh scans only recent pages.
CREATE INDEX scene_fingerprints_created_brin
  ON scene_fingerprints USING brin (created_at) WITH (pages_per_range = 32);

CREATE MATERIALIZED VIEW scene_popularity_all_time AS
SELECT scene_id, COUNT(DISTINCT user_id)::INT AS user_count
FROM scene_fingerprints
GROUP BY scene_id;

CREATE UNIQUE INDEX scene_popularity_all_time_scene_id_idx
  ON scene_popularity_all_time (scene_id);
CREATE INDEX scene_popularity_all_time_count_idx
  ON scene_popularity_all_time (user_count DESC, scene_id DESC);

CREATE MATERIALIZED VIEW scene_popularity_trending AS
SELECT scene_id, COUNT(DISTINCT user_id)::INT AS trending_count
FROM scene_fingerprints
WHERE created_at >= (now()::DATE - 7)
GROUP BY scene_id;

CREATE UNIQUE INDEX scene_popularity_trending_scene_id_idx
  ON scene_popularity_trending (scene_id);
CREATE INDEX scene_popularity_trending_count_idx
  ON scene_popularity_trending (trending_count DESC, scene_id DESC);

CREATE MATERIALIZED VIEW performer_popularity_all_time AS
SELECT sp.performer_id, COUNT(DISTINCT sf.user_id)::INT AS user_count
FROM scene_fingerprints sf
JOIN scene_performers sp ON sp.scene_id = sf.scene_id
GROUP BY sp.performer_id;

CREATE UNIQUE INDEX performer_popularity_all_time_performer_id_idx
  ON performer_popularity_all_time (performer_id);
CREATE INDEX performer_popularity_all_time_count_idx
  ON performer_popularity_all_time (user_count DESC, performer_id DESC);

-- Swap the unique constraint to (scene_id, user_id, fingerprint_id) so the
-- (scene_id, user_id) prefix powers streaming dedupe for the all_time refresh
-- and the LoadLinkedOshashSubmissions self-join.
ALTER TABLE scene_fingerprints
  DROP CONSTRAINT scene_fingerprints_scene_id_fingerprint_id_user_id_key;
ALTER TABLE scene_fingerprints
  ADD CONSTRAINT scene_fingerprints_scene_user_fp_key
  UNIQUE (scene_id, user_id, fingerprint_id);

-- Defaults never trigger autovacuum on these insert-heavy tables
ALTER TABLE scene_fingerprints SET (
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 2000
);
ALTER TABLE scene_performers SET (
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
