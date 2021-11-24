-- Unused index
DROP INDEX "index_scene_fingerprints_on_hash";

ALTER TABLE "scene_fingerprints" ADD CONSTRAINT "scene_hash_unique" UNIQUE ("scene_id", "hash"); 
ALTER TABLE "scene_fingerprints" DROP CONSTRAINT "scene_fingerprints_scene_id_algorithm_hash_key";

ALTER TABLE "scene_fingerprints" ADD COLUMN "submissions" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "scene_fingerprints" ADD COLUMN "created_at" TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE "scene_fingerprints" ADD COLUMN "updated_at" TIMESTAMP NOT NULL DEFAULT NOW();
