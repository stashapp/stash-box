DELETE FROM scene_images WHERE scene_id IN (SELECT id FROM scenes WHERE deleted = true);
DELETE FROM scene_fingerprints WHERE scene_id IN (SELECT id FROM scenes WHERE deleted = true);
