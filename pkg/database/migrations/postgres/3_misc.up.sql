ALTER TABLE "scenes"
ADD COLUMN duration integer
ADD COLUMN director TEXT;

ALTER TABLE "scene_urls"
ADD COLUMN id uuid,
ADD COLUMN height int,
ADD COLUMN width int;

ALTER TABLE "performer_urls"
ADD COLUMN id uuid,
ADD COLUMN height int,
ADD COLUMN width int;

ALTER TABLE "studio_urls"
ADD COLUMN id uuid,
ADD COLUMN height int,
ADD COLUMN width int;
