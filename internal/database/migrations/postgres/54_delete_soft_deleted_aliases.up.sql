DELETE FROM studio_aliases WHERE studio_id IN (SELECT id FROM studios WHERE deleted = true);
DELETE FROM tag_aliases WHERE tag_id IN (SELECT id FROM tags WHERE deleted = true);
