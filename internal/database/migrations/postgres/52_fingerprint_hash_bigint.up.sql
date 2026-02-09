-- Remove MD5 hashes from fingerprints table
DELETE FROM fingerprints WHERE algorithm = 'MD5';

-- Delete any hashes with non-hex values (must be valid 16-char hex for 64-bit conversion)
DELETE FROM fingerprints WHERE hash !~ '^[0-9a-fA-F]{16}$';

-- Remove MD5 fingerprints from edit data (added_fingerprints)
UPDATE edits
SET data = jsonb_set(
    data,
    '{new,added_fingerprints}',
    (
        SELECT COALESCE(jsonb_agg(fp), '[]'::jsonb)
        FROM jsonb_array_elements(data->'new'->'added_fingerprints') AS fp
        WHERE fp->>'algorithm' != 'MD5'
    )
)
WHERE data->'new'->'added_fingerprints' IS NOT NULL
  AND jsonb_array_length(data->'new'->'added_fingerprints') > 0;

-- Remove MD5 fingerprints from edit data (removed_fingerprints)
UPDATE edits
SET data = jsonb_set(
    data,
    '{new,removed_fingerprints}',
    (
        SELECT COALESCE(jsonb_agg(fp), '[]'::jsonb)
        FROM jsonb_array_elements(data->'new'->'removed_fingerprints') AS fp
        WHERE fp->>'algorithm' != 'MD5'
    )
)
WHERE data->'new'->'removed_fingerprints' IS NOT NULL
  AND jsonb_array_length(data->'new'->'removed_fingerprints') > 0;

-- Remove MD5 fingerprints from drafts
UPDATE drafts
SET data = jsonb_set(
    data,
    '{fingerprints}',
    (
        SELECT COALESCE(jsonb_agg(fp), '[]'::jsonb)
        FROM jsonb_array_elements(data->'fingerprints') AS fp
        WHERE fp->>'algorithm' != 'MD5'
    )
)
WHERE data->'fingerprints' IS NOT NULL
  AND jsonb_array_length(data->'fingerprints') > 0;

ALTER TABLE fingerprints DROP CONSTRAINT fingerprints_hash_algorithm_key;
DROP INDEX IF EXISTS fingerprints_phash_idx;

ALTER TABLE fingerprints RENAME COLUMN hash TO hash_old;

ALTER TABLE fingerprints ADD COLUMN hash BIGINT;
UPDATE fingerprints SET hash = ('x' || hash_old)::bit(64)::bigint;
ALTER TABLE fingerprints ALTER COLUMN hash SET NOT NULL;

ALTER TABLE fingerprints DROP COLUMN hash_old;

ALTER TABLE fingerprints ADD CONSTRAINT fingerprints_hash_algorithm_key UNIQUE (hash, algorithm);

-- Recreate bktree index on new bigint hash column if extension is available
DO $$
DECLARE
  extension pg_extension%rowtype;
BEGIN
  SELECT *
  INTO extension
  FROM pg_extension
  WHERE extname='bktree';

  IF found THEN
    CREATE INDEX fingerprints_phash_idx
    ON fingerprints
    USING spgist (hash bktree_ops)
    WHERE algorithm = 'PHASH';
  END IF;
END$$;
