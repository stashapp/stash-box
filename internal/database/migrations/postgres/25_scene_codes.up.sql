ALTER TABLE "scenes"
ADD COLUMN code TEXT;

ALTER TABLE "scene_search"
ADD COLUMN scene_code TEXT;

CREATE OR REPLACE FUNCTION update_scene() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.title != OLD.title OR NEW.date != OLD.date OR NEW.studio_id != OLD.studio_id OR COALESCE(NEW.code, '') != COALESCE(OLD.code, '')) THEN
UPDATE scene_search
SET
  scene_title = REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9 ]+', '', 'g'),
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
	REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9 ]+', '', 'g'),
	NEW.date,
	T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END,
  NEW.code
FROM studios T
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
WHERE T.id = NEW.studio_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

DROP INDEX ts_idx;
CREATE INDEX scene_search_ts_idx ON scene_search USING gist (
	(
        to_tsvector('simple', COALESCE(scene_date, '')) ||
        to_tsvector('english', studio_name) ||
        to_tsvector('english', COALESCE(performer_names, '')) ||
        to_tsvector('english', scene_title) ||
        to_tsvector('simple', COALESCE(scene_code, ''))
	)
);
