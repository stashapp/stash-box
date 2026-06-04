CREATE INDEX edits_user_id_idx ON edits (user_id);

-- Trigger is  only necessary when name changes. Ignore other field updates.
DROP TRIGGER trg_scene_search_on_performer ON performers;
CREATE TRIGGER trg_scene_search_on_performer
AFTER UPDATE OF name ON performers
FOR EACH ROW
WHEN (NEW.name IS DISTINCT FROM OLD.name)
EXECUTE FUNCTION trg_performer_changed_scenes();
