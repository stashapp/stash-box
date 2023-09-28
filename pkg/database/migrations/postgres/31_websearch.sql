-- Update the index to match the format of querybuilder_scene.SearchScenes()
DROP INDEX ts_idx;
CREATE INDEX scene_search_ts_idx ON scene_search USING gist (
    (
        to_tsvector('english', COALESCE(scene_date, '')) ||
        to_tsvector('english', studio_name) ||
        to_tsvector('english', COALESCE(performer_names, '')) ||
        to_tsvector('english', scene_title) ||
        to_tsvector('english', COALESCE(scene_code, ''))
    )
);

-- Update the scene_search functions to allow hyphens in the title when immediately followed by digit, to allow for JAV titles ex EMS-259
CREATE OR REPLACE FUNCTION update_scene() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.title != OLD.title OR NEW.date != OLD.date OR NEW.studio_id != OLD.studio_id OR COALESCE(NEW.code, '') != COALESCE(OLD.code, '')) THEN
UPDATE scene_search
SET
    scene_title = REGEXP_REPLACE(NEW.title, '(-?\d+)|[^a-zA-Z0-9 ]+', '\1', 'g'),
    scene_date = NEW.date,
    studio_name = SUBQUERY.studio_name,
    scene_code = NEW.code
FROM (
    SELECT S.id as sid, T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END AS studio_name
    FROM scenes S
    JOIN studios T ON S.studio_id = T.id
    LEFT JOIN studios TP ON T.parent_studio_id = TP.id
) SUBQUERY
WHERE scene_id = NEW.id
AND scene_id = SUBQUERY.sid;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE OR REPLACE FUNCTION insert_scene() RETURNS TRIGGER AS $$
BEGIN
INSERT INTO scene_search (scene_id, scene_title, scene_date, studio_name, scene_code)
SELECT
    NEW.id,
    REGEXP_REPLACE(NEW.title, '(-?\d+)|[^a-zA-Z0-9 ]+', '\1', 'g'),
    NEW.date,
    T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END,
    NEW.code
FROM studios T
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
WHERE T.id = NEW.studio_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.


TRUNCATE TABLE scene_search;

-- Recreate the table, allowing for JAV style titles like EMS-259
INSERT INTO scene_search
SELECT
    S.id as scene_id,
    REGEXP_REPLACE(S.title, '(-?\d+)|[^a-zA-Z0-9 ]+', '\1', 'g') AS scene_title,
    S.date::TEXT AS scene_date,
    T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END AS studio_name,
    ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(PS.as)), ' ', '') AS performer_names,
    S.code as scene_code
FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
GROUP BY S.id, S.title, T.name, TP.name;

