TRUNCATE TABLE scene_search;

INSERT INTO scene_search
SELECT
	S.id as scene_id,
	REGEXP_REPLACE(S.title, '[^a-zA-Z0-9 ]+', '', 'g') AS scene_title,
	S.date::TEXT AS scene_date,
	T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END AS studio_name,
  ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(PS.as)), ' ', '') AS performer_names
FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
GROUP BY S.id, S.title, T.name, TP.name;

CREATE OR REPLACE FUNCTION update_scene() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.title != OLD.title OR New.date != OLD.date OR New.studio_id != OLD.studio_id) THEN
UPDATE scene_search
SET
  scene_title = REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9 ]+', '', 'g'),
  scene_date = NEW.date,
  studio_name = SUBQUERY.studio_name
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
