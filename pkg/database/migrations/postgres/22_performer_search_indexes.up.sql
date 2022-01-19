CREATE INDEX disambiguation_trgm_idx ON "performers" USING GIN ("disambiguation" gin_trgm_ops);
CREATE INDEX performer_alias_trgm_idx ON "performer_aliases" USING GIN ("alias" gin_trgm_ops);
