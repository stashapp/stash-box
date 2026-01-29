-- ===========================================
-- Drop ParadeDB search infrastructure
-- ===========================================

-- Drop scene search triggers and functions
DROP TRIGGER IF EXISTS trg_scene_search_on_scene ON scenes;
DROP TRIGGER IF EXISTS trg_scene_search_on_performer ON performers;
DROP TRIGGER IF EXISTS trg_scene_search_on_studio ON studios;
DROP TRIGGER IF EXISTS trg_scene_search_on_sp_insert ON scene_performers;
DROP TRIGGER IF EXISTS trg_scene_search_on_sp_delete ON scene_performers;
DROP FUNCTION IF EXISTS trg_scene_changed();
DROP FUNCTION IF EXISTS trg_performer_changed_scenes();
DROP FUNCTION IF EXISTS trg_studio_changed_scenes();
DROP FUNCTION IF EXISTS trg_scene_performers_inserted();
DROP FUNCTION IF EXISTS trg_scene_performers_deleted();
DROP FUNCTION IF EXISTS upsert_scene_search(UUID);

-- Drop performer search triggers and functions
DROP TRIGGER IF EXISTS trg_performer_search_on_performer ON performers;
DROP TRIGGER IF EXISTS trg_performer_search_on_alias_insert ON performer_aliases;
DROP TRIGGER IF EXISTS trg_performer_search_on_alias_delete ON performer_aliases;
DROP FUNCTION IF EXISTS trg_performer_changed();
DROP FUNCTION IF EXISTS trg_performer_aliases_inserted();
DROP FUNCTION IF EXISTS trg_performer_aliases_deleted();
DROP FUNCTION IF EXISTS upsert_performer_search(UUID);

-- Drop studio search triggers and functions
DROP TRIGGER IF EXISTS trg_studio_search_on_studio ON studios;
DROP TRIGGER IF EXISTS trg_studio_search_on_alias_insert ON studio_aliases;
DROP TRIGGER IF EXISTS trg_studio_search_on_alias_delete ON studio_aliases;
DROP FUNCTION IF EXISTS trg_studio_changed();
DROP FUNCTION IF EXISTS trg_studio_aliases_inserted();
DROP FUNCTION IF EXISTS trg_studio_aliases_deleted();
DROP FUNCTION IF EXISTS upsert_studio_search(UUID);

-- Drop tag search triggers and functions
DROP TRIGGER IF EXISTS trg_tag_search_on_tag ON tags;
DROP TRIGGER IF EXISTS trg_tag_search_on_alias_insert ON tag_aliases;
DROP TRIGGER IF EXISTS trg_tag_search_on_alias_delete ON tag_aliases;
DROP FUNCTION IF EXISTS trg_tag_changed();
DROP FUNCTION IF EXISTS trg_tag_aliases_inserted();
DROP FUNCTION IF EXISTS trg_tag_aliases_deleted();
DROP FUNCTION IF EXISTS upsert_tag_search(UUID);

-- Drop search tables (indexes are dropped automatically)
DROP TABLE IF EXISTS scene_search;
DROP TABLE IF EXISTS performer_search;
DROP TABLE IF EXISTS studio_search;
DROP TABLE IF EXISTS tag_search;

-- ===========================================
-- Restore old scene_search infrastructure
-- ===========================================
CREATE TABLE scene_search AS
SELECT
    S.id as scene_id,
    REGEXP_REPLACE(S.title, '[^a-zA-Z0-9 -:]+', '', 'g') AS scene_title,
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

CREATE INDEX scene_search_ts_idx ON scene_search USING gist (
    (
        to_tsvector('english', COALESCE(scene_date, '')) ||
        to_tsvector('english', studio_name) ||
        to_tsvector('english', COALESCE(performer_names, '')) ||
        to_tsvector('english', scene_title) ||
        to_tsvector('english', COALESCE(scene_code, ''))
    )
);

-- Restore old trigger functions (from migration 35)
CREATE OR REPLACE FUNCTION update_performers() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_performer_search_name AFTER UPDATE ON performers FOR EACH ROW EXECUTE PROCEDURE update_performers();

CREATE OR REPLACE FUNCTION update_scene() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.title != OLD.title OR NEW.date != OLD.date OR NEW.studio_id != OLD.studio_id OR COALESCE(NEW.code, '') != COALESCE(OLD.code, '')) THEN
UPDATE scene_search
SET
    scene_title = REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9 -:]+', '', 'g'),
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scene_search_title AFTER UPDATE ON scenes FOR EACH ROW EXECUTE PROCEDURE update_scene();

CREATE OR REPLACE FUNCTION insert_scene() RETURNS TRIGGER AS $$
BEGIN
INSERT INTO scene_search (scene_id, scene_title, scene_date, studio_name, scene_code)
SELECT
    NEW.id,
    REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9 -:]+', '', 'g'),
    NEW.date,
    T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END,
    NEW.code
FROM studios T
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
WHERE T.id = NEW.studio_id;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER insert_scene_search AFTER INSERT ON scenes FOR EACH ROW EXECUTE PROCEDURE insert_scene();

CREATE OR REPLACE FUNCTION update_studio() RETURNS TRIGGER AS $$
BEGIN
IF (NEW.name != OLD.name) THEN
UPDATE scene_search SET studio_name = SUBQUERY.name
FROM (
    SELECT
        S.id,
        T.name || ' ' || REGEXP_REPLACE(T.name, '[^a-zA-Z0-9]', '', 'g') || ' ' || CASE WHEN TP.name IS NOT NULL THEN (TP.name || ' ' || REGEXP_REPLACE(TP.name, '[^a-zA-Z0-9]', '', 'g') ) ELSE '' END AS name
    FROM scenes S
    LEFT JOIN studios T ON T.id = S.studio_id
    LEFT JOIN studios TP ON T.parent_studio_id = TP.id
    WHERE T.id = NEW.id
    OR TP.id = NEW.id
) SUBQUERY
WHERE scene_id = SUBQUERY.id;
END IF;
RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_studio_search_name AFTER UPDATE ON studios FOR EACH ROW EXECUTE PROCEDURE update_studio();

CREATE OR REPLACE FUNCTION update_scene_performers() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scene_performers_search AFTER INSERT OR UPDATE OR DELETE ON scene_performers FOR EACH ROW EXECUTE PROCEDURE update_scene_performers();

-- ===========================================
-- Restore old trigram indexes
-- ===========================================
CREATE INDEX name_trgm_idx ON performers USING GIN (name gin_trgm_ops);
CREATE INDEX disambiguation_trgm_idx ON "performers" USING GIN ("disambiguation" gin_trgm_ops);
CREATE INDEX performer_alias_trgm_idx ON "performer_aliases" USING GIN ("alias" gin_trgm_ops);
