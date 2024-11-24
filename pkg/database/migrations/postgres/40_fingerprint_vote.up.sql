ALTER TABLE "scene_fingerprints" 
 ADD COLUMN "vote" SMALLINT NOT NULL DEFAULT 1 CHECK (vote = -1 OR vote = 1);
