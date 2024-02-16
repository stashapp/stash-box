CREATE TABLE "fingerprints" (
  "id" SERIAL PRIMARY KEY,
  "hash" VARCHAR(255) NOT NULL,
  "algorithm" VARCHAR(20) NOT NULL,
  UNIQUE ("hash", "algorithm")
);

INSERT INTO "fingerprints" (hash, algorithm)
SELECT hash, algorithm
FROM "scene_fingerprints"
GROUP BY hash, algorithm;

ALTER TABLE "scene_fingerprints" RENAME TO "_scene_fingerprints";

CREATE TABLE "scene_fingerprints" (
  "fingerprint_id" INT NOT NULL,
  "scene_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "duration" INT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY("fingerprint_id") REFERENCES "fingerprints"("id") ON DELETE CASCADE,
  FOREIGN KEY("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE,
  FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  UNIQUE ("scene_id", "fingerprint_id", "user_id")
);

INSERT INTO "scene_fingerprints"
SELECT F.id, scene_id, user_id, duration, created_at
FROM "_scene_fingerprints" SF
JOIN "fingerprints" F ON SF.hash = F.hash AND SF.algorithm = F.algorithm;

DROP TABLE "_scene_fingerprints";

CREATE INDEX "scene_fingerprints_fingerprint_idx" ON "scene_fingerprints" (fingerprint_id);
CREATE INDEX "scene_fingerprints_user_idx" on "scene_fingerprints" (user_id);
CREATE INDEX "scene_fingerprints_created_at" on "scene_fingerprints" (created_at);


-- Create phash index if bktree is available
DO $$
DECLARE
  extension pg_extension%rowtype;
BEGIN

  SELECT *
  INTO extension
  FROM pg_extension
  WHERE extname='bktree';

  IF found THEN
    CREATE INDEX fingerprints_phash_idx
    ON fingerprints
    USING spgist ((('x' || hash)::bit(64)::bigint) bktree_ops)
    WHERE algorithm = 'PHASH';
  END IF;

END$$;
