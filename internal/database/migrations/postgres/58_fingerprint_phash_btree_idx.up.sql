-- Add a partial B-tree index on fingerprints.hash for PHASH rows.
-- The bktree index implementation is bugged and fails on equality queries.
-- This partial index should take precedence and avoid the issue.
CREATE INDEX IF NOT EXISTS fingerprints_phash_btree_idx
    ON fingerprints (hash)
    WHERE algorithm = 'PHASH';
