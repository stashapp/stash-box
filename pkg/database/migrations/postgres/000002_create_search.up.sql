CREATE TABLE scene_search AS 
SELECT S.id as scene_id, S.title AS scene_title, T.name AS studio_name, STRING_AGG(P.name, ' ') || COALESCE(STRING_AGG(PS.as , ''), '') AS performer_names
FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
GROUP BY S.id, S.title, T.name;

CREATE INDEX name_trgm_idx ON performers USING GIN (name gin_trgm_ops);
CREATE INDEX ts_idx ON scene_search USING gist (
	(
		to_tsvector('english', scene_title) ||
		to_tsvector('english', studio_name)  ||
		to_tsvector('simple', COALESCE(performer_names, ''))
	)
);

CREATE FUNCTION update_performers() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.name != OLD.name) THEN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT S.id as scene_id, STRING_AGG(P.name, ' ') || COALESCE(STRING_AGG(PS.as , ''), '') AS performer_names
FROM scenes S
 LEFT JOIN scene_performers PS ON PS.scene_id = S.id
 LEFT JOIN performers P ON PS.performer_id = P.id
 WHERE P.id = NEW.id
 GROUP BY S.id
) SUBQUERY
WHERE scene_search.scene_id = SUBQUERY.scene_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE TRIGGER update_performer_search_name AFTER UPDATE ON performers FOR EACH ROW EXECUTE PROCEDURE update_performers();

CREATE FUNCTION update_scene() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.title != OLD.title) THEN
UPDATE scene_search SET scene_title = NEW.title
WHERE scene_id = NEW.scene_id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE TRIGGER update_scene_search_title AFTER UPDATE ON scenes FOR EACH ROW EXECUTE PROCEDURE update_scene();

CREATE FUNCTION insert_scene() RETURNS TRIGGER AS $$
BEGIN
INSERT INTO scene_search (scene_id, scene_title, studio_name)
SELECT NEW.id, NEW.title, T.name FROM studios T WHERE T.id = NEW.studio_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE TRIGGER insert_scene_search AFTER INSERT ON scenes FOR EACH ROW EXECUTE PROCEDURE insert_scene();

CREATE FUNCTION update_studio() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.name != OLD.name) THEN
UPDATE scene_search SET studio_name = SUBQUERY.name
FROM (
SELECT S.id, T.name FROM scenes S
LEFT JOIN studios T ON T.id = S.studio_id 
WHERE T.id = NEW.id
) SUBQUERY
WHERE scene_id = SUBQUERY.id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE TRIGGER update_studio_search_name AFTER UPDATE ON studios FOR EACH ROW EXECUTE PROCEDURE update_studio();

CREATE FUNCTION update_scene_performers() RETURNS TRIGGER AS $$
BEGIN
UPDATE scene_search SET performer_names = SUBQUERY.performer_names
FROM (
SELECT S.id as scene_id, STRING_AGG(P.name, ' ') || COALESCE(STRING_AGG(PS.as , ''), '') AS performer_names
FROM scenes S
 LEFT JOIN scene_performers PS ON PS.scene_id = S.id
 LEFT JOIN performers P ON PS.performer_id = P.id
 WHERE S.id = OLD.scene_id
 GROUP BY S.id
) SUBQUERY
WHERE scene_search.scene_id = SUBQUERY.scene_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql; --The trigger used to update a table.

CREATE TRIGGER update_scene_performers_search AFTER INSERT OR UPDATE OR DELETE ON scene_performers FOR EACH ROW EXECUTE PROCEDURE update_scene_performers();
