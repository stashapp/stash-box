CREATE INDEX scene_edit_studio_added_idx ON edits
((data->'old_data'->>'studio_id'))
WHERE target_type = 'SCENE';

CREATE INDEX scene_edit_studio_removed_idx ON edits
((data->'new_data'->>'studio_id'))
WHERE target_type = 'SCENE';
