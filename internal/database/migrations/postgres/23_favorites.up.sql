CREATE TABLE performer_favorites (
    performer_id uuid REFERENCES performers(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE studio_favorites (
    studio_id uuid REFERENCES studios(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL
);

CREATE INDEX scene_edit_performers_added_idx ON edits USING GIN
(jsonb_path_query_array(data, '$.new_data.added_performers[*].performer_id'))
WHERE target_type = 'SCENE';

CREATE INDEX scene_edit_performers_removed_idx ON edits USING GIN
(jsonb_path_query_array(data, '$.new_data.removed_performers[*].performer_id'))
WHERE target_type = 'SCENE';
