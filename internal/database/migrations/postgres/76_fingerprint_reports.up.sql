-- Reports are moderation work, not submissions. The hash is deliberately not a
-- fingerprint FK: deleting the last submission must not delete its report.
CREATE TABLE fingerprint_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash BIGINT NOT NULL,
    algorithm TEXT NOT NULL CHECK (algorithm IN ('MD5', 'OSHASH', 'PHASH')),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    correct_scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COMPLETED', 'INCORRECT')),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CHECK (correct_scene_id IS NULL OR correct_scene_id <> scene_id),
    CHECK ((status = 'OPEN') = (resolved_at IS NULL))
);
CREATE UNIQUE INDEX fingerprint_reports_open_user_key
    ON fingerprint_reports (scene_id, hash, algorithm, user_id) WHERE status = 'OPEN';
CREATE INDEX fingerprint_reports_queue_idx ON fingerprint_reports (status, created_at, id);
CREATE INDEX fingerprint_reports_expiry_idx ON fingerprint_reports (resolved_at) WHERE resolved_at IS NOT NULL;

INSERT INTO fingerprint_reports (hash, algorithm, scene_id, user_id, created_at)
SELECT f.hash, f.algorithm, sf.scene_id, sf.user_id, sf.created_at
FROM scene_fingerprints sf JOIN fingerprints f ON f.id = sf.fingerprint_id
WHERE sf.vote = -1;

DELETE FROM scene_fingerprints WHERE vote = -1;
ALTER TABLE scene_fingerprints DROP COLUMN vote;

-- These views previously counted reporters as well as submitters.
REFRESH MATERIALIZED VIEW scene_popularity_all_time;
REFRESH MATERIALIZED VIEW scene_popularity_trending;
REFRESH MATERIALIZED VIEW performer_popularity_all_time;
