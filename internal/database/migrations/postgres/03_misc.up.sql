ALTER TABLE "scenes"
ADD COLUMN duration integer,
ADD COLUMN director TEXT;

ALTER TABLE "scene_fingerprints"
ADD COLUMN duration int;
