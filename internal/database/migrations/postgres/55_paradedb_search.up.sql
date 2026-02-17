CREATE EXTENSION IF NOT EXISTS pg_search;

-- ===========================================
-- Remove old scene_search infrastructure
-- ===========================================
DROP TRIGGER IF EXISTS update_performer_search_name ON performers;
DROP TRIGGER IF EXISTS update_scene_search_title ON scenes;
DROP TRIGGER IF EXISTS insert_scene_search ON scenes;
DROP TRIGGER IF EXISTS update_studio_search_name ON studios;
DROP TRIGGER IF EXISTS update_scene_performers_search ON scene_performers;
DROP FUNCTION IF EXISTS update_performers();
DROP FUNCTION IF EXISTS update_scene();
DROP FUNCTION IF EXISTS insert_scene();
DROP FUNCTION IF EXISTS update_studio();
DROP FUNCTION IF EXISTS update_scene_performers();
DROP INDEX IF EXISTS scene_search_ts_idx;
DROP INDEX IF EXISTS scene_search_scene_id_idx;
DROP TABLE IF EXISTS scene_search;

-- ===========================================
-- Scene search
-- ===========================================
CREATE TABLE scene_search (
    scene_id UUID PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
    scene_title TEXT,
    scene_date TEXT,
    studio_name TEXT,
    network_name TEXT,
    performer_names TEXT[],
    scene_code TEXT
);

INSERT INTO scene_search
SELECT S.id, S.title, S.date::TEXT, T.name, TP.name,
       COALESCE(ARRAY_AGG(DISTINCT P.name) FILTER (WHERE P.name IS NOT NULL), '{}') ||
       COALESCE(ARRAY_AGG(DISTINCT PS."as") FILTER (WHERE PS."as" IS NOT NULL), '{}'),
       S.code
FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
GROUP BY S.id, T.name, TP.name;

CREATE INDEX scene_search_bm25_idx ON scene_search
USING bm25 (
    scene_id,
    scene_title,
    scene_date,
    studio_name,
    network_name,
    performer_names,
    scene_code
)
WITH (key_field='scene_id');

CREATE OR REPLACE FUNCTION upsert_scene_search(sid UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO scene_search (scene_id, scene_title, scene_date, studio_name, network_name, performer_names, scene_code)
    SELECT S.id, S.title, S.date::TEXT, T.name, TP.name,
           COALESCE(ARRAY_AGG(DISTINCT P.name) FILTER (WHERE P.name IS NOT NULL), '{}') ||
           COALESCE(ARRAY_AGG(DISTINCT PS."as") FILTER (WHERE PS."as" IS NOT NULL), '{}'),
           S.code
    FROM scenes S
    LEFT JOIN scene_performers PS ON PS.scene_id = S.id
    LEFT JOIN performers P ON PS.performer_id = P.id
    LEFT JOIN studios T ON T.id = S.studio_id
    LEFT JOIN studios TP ON T.parent_studio_id = TP.id
    WHERE S.id = sid
    GROUP BY S.id, T.name, TP.name
    ON CONFLICT (scene_id) DO UPDATE SET
        scene_title = EXCLUDED.scene_title, scene_date = EXCLUDED.scene_date,
        studio_name = EXCLUDED.studio_name, network_name = EXCLUDED.network_name,
        performer_names = EXCLUDED.performer_names, scene_code = EXCLUDED.scene_code;
END;
$$ LANGUAGE plpgsql;

-- On scene insert/update
CREATE OR REPLACE FUNCTION trg_scene_changed() RETURNS TRIGGER AS $$
BEGIN PERFORM upsert_scene_search(NEW.id); RETURN NULL; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_scene
AFTER INSERT OR UPDATE ON scenes
FOR EACH ROW EXECUTE FUNCTION trg_scene_changed();

-- On performer name change -> repopulate all their scenes
CREATE OR REPLACE FUNCTION trg_performer_changed_scenes() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM scene_performers WHERE performer_id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_performer
AFTER UPDATE ON performers
FOR EACH ROW EXECUTE FUNCTION trg_performer_changed_scenes();

-- Studio name change -> populate scenes under this studio and its child studios
CREATE OR REPLACE FUNCTION trg_studio_changed_scenes() RETURNS TRIGGER AS $$
BEGIN
    -- Scenes directly under this studio
    PERFORM upsert_scene_search(id)
    FROM scenes WHERE studio_id = NEW.id;
    -- Scenes under child studios (network name changed)
    PERFORM upsert_scene_search(S.id)
    FROM scenes S
    JOIN studios ST ON S.studio_id = ST.id
    WHERE ST.parent_studio_id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_studio
AFTER UPDATE ON studios
FOR EACH ROW EXECUTE FUNCTION trg_studio_changed_scenes();

-- On scene_performers insert
CREATE OR REPLACE FUNCTION trg_scene_performers_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM (SELECT DISTINCT scene_id FROM new_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_sp_insert
AFTER INSERT ON scene_performers
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_scene_performers_inserted();

-- On scene_performers delete
CREATE OR REPLACE FUNCTION trg_scene_performers_deleted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(scene_id)
    FROM (SELECT DISTINCT scene_id FROM old_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_sp_delete
AFTER DELETE ON scene_performers
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_scene_performers_deleted();

-- ===========================================
-- Performer search
-- ===========================================
CREATE TABLE performer_search (
    performer_id UUID PRIMARY KEY REFERENCES performers(id) ON DELETE CASCADE,
    name TEXT,
    disambiguation TEXT,
    aliases TEXT[],
    gender TEXT
);

INSERT INTO performer_search
SELECT P.id, P.name, P.disambiguation,
       ARRAY_AGG(PA.alias) FILTER (WHERE PA.alias IS NOT NULL),
       P.gender
FROM performers P
LEFT JOIN performer_aliases PA ON PA.performer_id = P.id
GROUP BY P.id;

CREATE INDEX performer_search_bm25_idx ON performer_search
USING bm25 (
    performer_id,
    name,
    disambiguation,
    aliases,
    (gender::pdb.literal)
)
WITH (key_field='performer_id');

CREATE OR REPLACE FUNCTION upsert_performer_search(pid UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO performer_search (performer_id, name, disambiguation, aliases, gender)
    SELECT P.id, P.name, P.disambiguation,
           ARRAY_AGG(PA.alias) FILTER (WHERE PA.alias IS NOT NULL),
           P.gender
    FROM performers P
    LEFT JOIN performer_aliases PA ON PA.performer_id = P.id
    WHERE P.id = pid
    GROUP BY P.id
    ON CONFLICT (performer_id) DO UPDATE SET
        name = EXCLUDED.name, disambiguation = EXCLUDED.disambiguation, aliases = EXCLUDED.aliases,
        gender = EXCLUDED.gender;
END;
$$ LANGUAGE plpgsql;

-- On performer insert/update
CREATE OR REPLACE FUNCTION trg_performer_changed() RETURNS TRIGGER AS $$
BEGIN PERFORM upsert_performer_search(NEW.id); RETURN NULL; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_performer_search_on_performer
AFTER INSERT OR UPDATE ON performers
FOR EACH ROW EXECUTE FUNCTION trg_performer_changed();

-- On performer_aliases insert
CREATE OR REPLACE FUNCTION trg_performer_aliases_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_performer_search(performer_id)
    FROM (SELECT DISTINCT performer_id FROM new_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_performer_search_on_alias_insert
AFTER INSERT ON performer_aliases
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_performer_aliases_inserted();

-- On performer_aliases delete
CREATE OR REPLACE FUNCTION trg_performer_aliases_deleted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_performer_search(performer_id)
    FROM (SELECT DISTINCT performer_id FROM old_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_performer_search_on_alias_delete
AFTER DELETE ON performer_aliases
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_performer_aliases_deleted();

-- ===========================================
-- Studio search
-- ===========================================
CREATE TABLE studio_search (
    studio_id UUID PRIMARY KEY REFERENCES studios(id) ON DELETE CASCADE,
    name TEXT,
    network TEXT,
    aliases TEXT[]
);

INSERT INTO studio_search
SELECT S.id, S.name, SP.name,
       ARRAY_AGG(SA.alias) FILTER (WHERE SA.alias IS NOT NULL)
FROM studios S
LEFT JOIN studios SP ON S.parent_studio_id = SP.id
LEFT JOIN studio_aliases SA ON SA.studio_id = S.id
GROUP BY S.id, SP.name;

CREATE INDEX studio_search_bm25_idx ON studio_search
USING bm25 (studio_id, name, network, aliases)
WITH (key_field='studio_id');

CREATE OR REPLACE FUNCTION upsert_studio_search(sid UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO studio_search (studio_id, name, network, aliases)
    SELECT S.id, S.name, SP.name,
           ARRAY_AGG(SA.alias) FILTER (WHERE SA.alias IS NOT NULL)
    FROM studios S
    LEFT JOIN studios SP ON S.parent_studio_id = SP.id
    LEFT JOIN studio_aliases SA ON SA.studio_id = S.id
    WHERE S.id = sid
    GROUP BY S.id, SP.name
    ON CONFLICT (studio_id) DO UPDATE SET
        name = EXCLUDED.name, network = EXCLUDED.network, aliases = EXCLUDED.aliases;
END;
$$ LANGUAGE plpgsql;

-- On studio insert/update -> upsert self + upsert child studios (parent name changed)
CREATE OR REPLACE FUNCTION trg_studio_changed() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_studio_search(NEW.id);
    -- If name changed, update child studios that reference this as parent
    PERFORM upsert_studio_search(id)
    FROM studios WHERE parent_studio_id = NEW.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_studio_search_on_studio
AFTER INSERT OR UPDATE ON studios
FOR EACH ROW EXECUTE FUNCTION trg_studio_changed();

-- On studio_aliases insert
CREATE OR REPLACE FUNCTION trg_studio_aliases_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_studio_search(studio_id)
    FROM (SELECT DISTINCT studio_id FROM new_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_studio_search_on_alias_insert
AFTER INSERT ON studio_aliases
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_studio_aliases_inserted();

-- On studio_aliases delete
CREATE OR REPLACE FUNCTION trg_studio_aliases_deleted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_studio_search(studio_id)
    FROM (SELECT DISTINCT studio_id FROM old_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_studio_search_on_alias_delete
AFTER DELETE ON studio_aliases
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_studio_aliases_deleted();

-- ===========================================
-- Tag search
-- ===========================================
CREATE TABLE tag_search (
    tag_id UUID PRIMARY KEY REFERENCES tags(id) ON DELETE CASCADE,
    name TEXT,
    aliases TEXT[]
);

INSERT INTO tag_search
SELECT T.id, T.name,
       ARRAY_AGG(TA.alias) FILTER (WHERE TA.alias IS NOT NULL)
FROM tags T
LEFT JOIN tag_aliases TA ON TA.tag_id = T.id
GROUP BY T.id;

CREATE INDEX tag_search_bm25_idx ON tag_search
USING bm25 (tag_id, name, aliases)
WITH (key_field='tag_id');

CREATE OR REPLACE FUNCTION upsert_tag_search(tid UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO tag_search (tag_id, name, aliases)
    SELECT T.id, T.name,
           ARRAY_AGG(TA.alias) FILTER (WHERE TA.alias IS NOT NULL)
    FROM tags T
    LEFT JOIN tag_aliases TA ON TA.tag_id = T.id
    WHERE T.id = tid
    GROUP BY T.id
    ON CONFLICT (tag_id) DO UPDATE SET
        name = EXCLUDED.name, aliases = EXCLUDED.aliases;
END;
$$ LANGUAGE plpgsql;

-- On tag insert/update
CREATE OR REPLACE FUNCTION trg_tag_changed() RETURNS TRIGGER AS $$
BEGIN PERFORM upsert_tag_search(NEW.id); RETURN NULL; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_tag_search_on_tag
AFTER INSERT OR UPDATE ON tags
FOR EACH ROW EXECUTE FUNCTION trg_tag_changed();

-- On tag_aliases insert
CREATE OR REPLACE FUNCTION trg_tag_aliases_inserted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_tag_search(tag_id)
    FROM (SELECT DISTINCT tag_id FROM new_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_tag_search_on_alias_insert
AFTER INSERT ON tag_aliases
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_tag_aliases_inserted();

-- On tag_aliases delete
CREATE OR REPLACE FUNCTION trg_tag_aliases_deleted() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_tag_search(tag_id)
    FROM (SELECT DISTINCT tag_id FROM old_rows) affected;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_tag_search_on_alias_delete
AFTER DELETE ON tag_aliases
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_tag_aliases_deleted();

-- ===========================================
-- Drop old trigram indexes
-- ===========================================
DROP INDEX IF EXISTS name_trgm_idx;
DROP INDEX IF EXISTS disambiguation_trgm_idx;
DROP INDEX IF EXISTS performer_alias_trgm_idx;
