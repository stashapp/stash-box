DROP TABLE scene_search;
DROP INDEX name_trgm_idx;

DROP TRIGGER refresh_scene_search ON scenes;
DROP TRIGGER refresh_scene_search ON scene_performers;
DROP TRIGGER refresh_scene_search ON performers;
DROP TRIGGER refresh_scene_search ON studios;

DROP FUNCTION refresh_scene_search;
