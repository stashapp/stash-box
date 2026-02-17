-- Body modifications
ALTER TABLE performer_tattoos ALTER COLUMN location TYPE text;
ALTER TABLE performer_tattoos ALTER COLUMN description TYPE text;
ALTER TABLE performer_piercings ALTER COLUMN location TYPE text;
ALTER TABLE performer_piercings ALTER COLUMN description TYPE text;

-- Descriptions
ALTER TABLE tags ALTER COLUMN description TYPE text;
ALTER TABLE performers ALTER COLUMN disambiguation TYPE text;

-- Aliases
ALTER TABLE performer_aliases ALTER COLUMN alias TYPE text;
ALTER TABLE studio_aliases ALTER COLUMN alias TYPE text;
ALTER TABLE tag_aliases ALTER COLUMN alias TYPE text;

-- Scene fields
ALTER TABLE scenes ALTER COLUMN title TYPE text;
ALTER TABLE scene_performers ALTER COLUMN "as" TYPE text;
