DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS scenes_title_trgm_idx ON scenes USING GIN (title gin_trgm_ops);
  END IF;
END;
$$;
