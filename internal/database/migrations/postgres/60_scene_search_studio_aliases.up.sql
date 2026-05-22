DROP INDEX IF EXISTS scene_search_bm25_idx;
DROP TABLE IF EXISTS scene_search;

CREATE TABLE scene_search (
    scene_id UUID PRIMARY KEY REFERENCES scenes(id) ON DELETE CASCADE,
    scene_title TEXT,
    scene_date TEXT,
    studio_name TEXT,
    network_name TEXT,
    studio_aliases TEXT[],
    network_aliases TEXT[],
    performer_names TEXT[],
    scene_code TEXT
);

INSERT INTO scene_search
SELECT S.id, S.title, S.date::TEXT, T.name, TP.name,
       COALESCE(ARRAY_AGG(DISTINCT SA.alias) FILTER (WHERE SA.alias IS NOT NULL), '{}'),
       COALESCE(ARRAY_AGG(DISTINCT PA.alias) FILTER (WHERE PA.alias IS NOT NULL), '{}'),
       COALESCE(ARRAY_AGG(DISTINCT P.name) FILTER (WHERE P.name IS NOT NULL), '{}') ||
       COALESCE(ARRAY_AGG(DISTINCT PS."as") FILTER (WHERE PS."as" IS NOT NULL), '{}'),
       S.code
FROM scenes S
LEFT JOIN scene_performers PS ON PS.scene_id = S.id
LEFT JOIN performers P ON PS.performer_id = P.id
LEFT JOIN studios T ON T.id = S.studio_id
LEFT JOIN studio_aliases SA ON SA.studio_id = T.id
LEFT JOIN studios TP ON T.parent_studio_id = TP.id
LEFT JOIN studio_aliases PA ON PA.studio_id = TP.id
WHERE S.deleted = false
GROUP BY S.id, T.name, TP.name;

CREATE INDEX scene_search_bm25_idx ON scene_search
USING bm25 (
    scene_id,
    scene_title,
    scene_date,
    studio_name,
    network_name,
    studio_aliases,
    network_aliases,
    performer_names,
    scene_code
)
WITH (
    key_field='scene_id',
    text_fields='{
        "performer_names": {"fieldnorms": false, "record": "basic"},
        "studio_aliases": {"fieldnorms": false, "record": "basic"},
        "network_aliases": {"fieldnorms": false, "record": "basic"}
    }'
);

CREATE OR REPLACE FUNCTION upsert_scene_search(sid UUID) RETURNS VOID AS $$
BEGIN
    DELETE FROM scene_search WHERE scene_id = sid
        AND EXISTS (SELECT 1 FROM scenes WHERE id = sid AND deleted = true);

    INSERT INTO scene_search (scene_id, scene_title, scene_date, studio_name, network_name, studio_aliases, network_aliases, performer_names, scene_code)
    SELECT S.id, S.title, S.date::TEXT, T.name, TP.name,
           COALESCE(ARRAY_AGG(DISTINCT SA.alias) FILTER (WHERE SA.alias IS NOT NULL), '{}'),
           COALESCE(ARRAY_AGG(DISTINCT PA.alias) FILTER (WHERE PA.alias IS NOT NULL), '{}'),
           COALESCE(ARRAY_AGG(DISTINCT P.name) FILTER (WHERE P.name IS NOT NULL), '{}') ||
           COALESCE(ARRAY_AGG(DISTINCT PS."as") FILTER (WHERE PS."as" IS NOT NULL), '{}'),
           S.code
    FROM scenes S
    LEFT JOIN scene_performers PS ON PS.scene_id = S.id
    LEFT JOIN performers P ON PS.performer_id = P.id
    LEFT JOIN studios T ON T.id = S.studio_id
    LEFT JOIN studio_aliases SA ON SA.studio_id = T.id
    LEFT JOIN studios TP ON T.parent_studio_id = TP.id
    LEFT JOIN studio_aliases PA ON PA.studio_id = TP.id
    WHERE S.id = sid AND S.deleted = false
    GROUP BY S.id, T.name, TP.name
    ON CONFLICT (scene_id) DO UPDATE SET
        scene_title = EXCLUDED.scene_title, scene_date = EXCLUDED.scene_date,
        studio_name = EXCLUDED.studio_name, network_name = EXCLUDED.network_name,
        studio_aliases = EXCLUDED.studio_aliases, network_aliases = EXCLUDED.network_aliases,
        performer_names = EXCLUDED.performer_names, scene_code = EXCLUDED.scene_code;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scene_search_on_studio_alias_insert ON studio_aliases;
DROP TRIGGER IF EXISTS trg_scene_search_on_studio_alias_delete ON studio_aliases;

CREATE OR REPLACE FUNCTION trg_studio_aliases_inserted_scenes() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(S.id)
    FROM scenes S
    JOIN (SELECT DISTINCT studio_id FROM new_rows) affected ON S.studio_id = affected.studio_id;
    PERFORM upsert_scene_search(S.id)
    FROM scenes S
    JOIN studios ST ON S.studio_id = ST.id
    JOIN (SELECT DISTINCT studio_id FROM new_rows) affected ON ST.parent_studio_id = affected.studio_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_studio_alias_insert
AFTER INSERT ON studio_aliases
REFERENCING NEW TABLE AS new_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_studio_aliases_inserted_scenes();

CREATE OR REPLACE FUNCTION trg_studio_aliases_deleted_scenes() RETURNS TRIGGER AS $$
BEGIN
    PERFORM upsert_scene_search(S.id)
    FROM scenes S
    JOIN (SELECT DISTINCT studio_id FROM old_rows) affected ON S.studio_id = affected.studio_id;
    PERFORM upsert_scene_search(S.id)
    FROM scenes S
    JOIN studios ST ON S.studio_id = ST.id
    JOIN (SELECT DISTINCT studio_id FROM old_rows) affected ON ST.parent_studio_id = affected.studio_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_scene_search_on_studio_alias_delete
AFTER DELETE ON studio_aliases
REFERENCING OLD TABLE AS old_rows
FOR EACH STATEMENT EXECUTE FUNCTION trg_studio_aliases_deleted_scenes();
