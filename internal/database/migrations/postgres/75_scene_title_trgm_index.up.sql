DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX scenes_title_trgm_idx ON "scenes" USING GIN ("title" gin_trgm_ops);
    -- queryPerformers matches both of these with ILIKE, on every query and again
    -- on its count.
    CREATE INDEX performers_name_trgm_idx ON "performers" USING GIN ("name" gin_trgm_ops);
    CREATE INDEX performers_disambiguation_trgm_idx ON "performers" USING GIN ("disambiguation" gin_trgm_ops);
  END IF;
END$$;

-- Sorting edits previously had no index to work with, forcing a full scan and
-- sort of the whole table. QueryEdits only ever sorts on these three keys.
CREATE INDEX edits_created_at_idx ON "edits" ("created_at", "id");
CREATE INDEX edits_closed_at_idx ON "edits" ((COALESCE("closed_at", "created_at")), "id");
CREATE INDEX edits_updated_at_idx ON "edits" ((COALESCE("updated_at", "created_at")), "id");
