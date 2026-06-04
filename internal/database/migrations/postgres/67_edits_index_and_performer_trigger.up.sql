CREATE INDEX edits_user_id_idx ON edits (user_id);

-- upsert_scene_search only reads performers.name from the performer row,
-- so the per-scene fan-out only needs to fire when the name actually changes.
-- Previously this trigger ran on every UPDATE (height, ethnicity, ...),
-- causing 1+ second writes for performers with many scenes.
DROP TRIGGER trg_scene_search_on_performer ON performers;
CREATE TRIGGER trg_scene_search_on_performer
AFTER UPDATE OF name ON performers
FOR EACH ROW
WHEN (NEW.name IS DISTINCT FROM OLD.name)
EXECUTE FUNCTION trg_performer_changed_scenes();
