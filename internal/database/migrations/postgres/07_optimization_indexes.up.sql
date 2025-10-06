CREATE INDEX performer_images_performer_id_idx ON performer_images (performer_id);
CREATE INDEX scenes_date_idx ON scenes (date DESC NULLS LAST);
CREATE INDEX scene_images_scene_id_idx ON scene_images (scene_id);
CREATE INDEX scene_performers_performer_idx ON scene_performers (performer_id);
CREATE INDEX scene_tags_tag_id_idx ON scene_tags (tag_id);
CREATE INDEX scene_fingerprints_hash_idx ON scene_fingerprints (hash);
CREATE INDEX studio_images_studio_id_idx ON studio_images (studio_id);
CREATE INDEX tag_aliases_tag_id_idx ON tag_aliases (tag_id);
CREATE INDEX tags_name_idx ON tags (name);
