-- Remove existing orphaned fingerprints (no scene_fingerprints reference them).
DELETE FROM fingerprints F
WHERE NOT EXISTS (
    SELECT 1 FROM scene_fingerprints SFP WHERE SFP.fingerprint_id = F.id
);

CREATE OR REPLACE FUNCTION delete_orphan_fingerprints() RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM fingerprints F
    WHERE F.id IN (SELECT DISTINCT fingerprint_id FROM deleted_rows)
      AND NOT EXISTS (
          SELECT 1 FROM scene_fingerprints SFP WHERE SFP.fingerprint_id = F.id
      );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scene_fingerprints_cleanup_orphans
AFTER DELETE ON scene_fingerprints
REFERENCING OLD TABLE AS deleted_rows
FOR EACH STATEMENT
EXECUTE FUNCTION delete_orphan_fingerprints();
