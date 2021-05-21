-- Enable bktree extension if available and user is superuser
DO $$
DECLARE
  extension pg_available_extensions%rowtype;
BEGIN

  SELECT *
  INTO extension
  FROM pg_available_extensions
  WHERE name='bktree';

  IF found and current_setting('is_superuser') = 'on' THEN
    CREATE EXTENSION IF NOT EXISTS bktree;
  END IF;

END$$;

-- Create phash index if bktree is available
DO $$
DECLARE
  extension pg_extension%rowtype;
BEGIN

  SELECT *
  INTO extension
  FROM pg_extension
  WHERE extname='bktree';

  IF found THEN
    CREATE INDEX scene_fingerprints_phash_index
    ON scene_fingerprints
    USING spgist ((('x' || hash)::bit(64)::bigint) bktree_ops)
    WHERE algorithm = 'PHASH';
  END IF;

END$$;
