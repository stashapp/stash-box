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

CREATE OR REPLACE FUNCTION update_performers() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.name != OLD.name) THEN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT S.id as scene_id, ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(PPS.as)), ' ', '') AS performer_names
 FROM scene_performers PS
 JOIN scenes S ON PS.scene_id = S.id
 LEFT JOIN scene_performers PPS ON S.id = PPS.scene_id
 LEFT JOIN performers P ON PPS.performer_id = P.id
 WHERE PS.performer_id = NEW.id
 GROUP BY S.id
) SUBQUERY
WHERE scene_search.scene_id = SUBQUERY.scene_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_scene_performers() RETURNS TRIGGER AS $$
BEGIN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT PS.scene_id as scene_id, ARRAY_TO_STRING(ARRAY_CAT(ARRAY_AGG(P.name), ARRAY_AGG(PS.as)), ' ', '') AS performer_names
 FROM scene_performers PS
 LEFT JOIN performers P ON PS.performer_id = P.id
 WHERE PS.scene_id = NEW.scene_id
 GROUP BY PS.scene_id
) SUBQUERY
WHERE scene_search.scene_id = COALESCE(NEW.scene_id, OLD.scene_id);
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

