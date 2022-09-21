CREATE INDEX scene_edit_fingerprint_added_idx ON edits USING GIN
(jsonb_path_query_array(data, '$.new_data.added_fingerprints[*].hash'))
WHERE target_type = 'SCENE';
