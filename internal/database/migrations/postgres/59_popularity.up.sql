CREATE MATERIALIZED VIEW scene_popularity AS
SELECT
  scene_id,
  COUNT(DISTINCT user_id)::INT AS user_count,
  NULLIF(COUNT(*) FILTER (WHERE created_at >= (now()::DATE - 7)), 0)::INT AS trending_count
FROM scene_fingerprints
GROUP BY scene_id;

CREATE UNIQUE INDEX scene_popularity_scene_id_idx ON scene_popularity (scene_id);
CREATE INDEX scene_popularity_count_idx ON scene_popularity (user_count DESC, scene_id DESC);
CREATE INDEX scene_popularity_trending_idx ON scene_popularity (trending_count DESC, scene_id DESC) WHERE trending_count IS NOT NULL;

CREATE MATERIALIZED VIEW performer_popularity AS
SELECT sp.performer_id, COUNT(DISTINCT sf.user_id)::INT AS user_count
FROM scene_fingerprints sf
JOIN scene_performers sp ON sp.scene_id = sf.scene_id
GROUP BY sp.performer_id;

CREATE UNIQUE INDEX performer_popularity_performer_id_idx ON performer_popularity (performer_id);
CREATE INDEX performer_popularity_count_idx ON performer_popularity (user_count DESC, performer_id DESC);

DROP INDEX scene_fingerprints_created_at;
