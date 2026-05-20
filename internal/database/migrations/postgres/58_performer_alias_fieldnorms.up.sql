DROP INDEX performer_search_bm25_idx;
CREATE INDEX performer_search_bm25_idx ON performer_search
USING bm25 (
    performer_id,
    name,
    disambiguation,
    aliases,
    (gender::pdb.literal)
)
WITH (
    key_field='performer_id',
    text_fields='{"aliases": {"fieldnorms": false, "record": "basic"}}'
);
