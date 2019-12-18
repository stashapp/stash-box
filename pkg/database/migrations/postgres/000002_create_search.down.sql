DROP TABLE scene_search;
DROP INDEX name_trgm_idx;
DROP INDEX ts_idx;

DROP FUNCTION update_performers;
DROP TRIGGER update_performer_search_name;

DROP FUNCTION update_scene;
DROP TRIGGER update_scene_search_title;

DROP FUNCTION insert_scene;
DROP TRIGGER insert_scene_search;

DROP FUNCTION update_studio;
DROP TRIGGER update_studio_search_name;

DROP FUNCTION update_scene_performers;
DROP TRIGGER update_scene_performers_search;
