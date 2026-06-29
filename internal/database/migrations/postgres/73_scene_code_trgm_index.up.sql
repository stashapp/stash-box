DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX scenes_code_trgm_idx ON "scenes" USING GIN ("code" gin_trgm_ops);
  END IF;
END$$;
