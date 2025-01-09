DELETE FROM "performer_favorites" PF
WHERE  EXISTS (
   SELECT FROM "performer_favorites"
   WHERE  performer_id = PF.performer_id
   AND    user_id = PF.user_id
   AND    ctid < PF.ctid
);

CREATE UNIQUE INDEX "performer_favorites_unique_idx" ON "performer_favorites" (performer_id, user_id);

DROP INDEX performer_favorites_idx;

DELETE FROM "studio_favorites" SF
WHERE  EXISTS (
   SELECT FROM "studio_favorites"
   WHERE  studio_id = SF.studio_id
   AND    user_id = SF.user_id
   AND    ctid < SF.ctid
);

CREATE UNIQUE INDEX "studio_favorites_unique_idx" ON "studio_favorites" (studio_id, user_id);

DROP INDEX studio_favorites_idx;

ALTER TABLE "performer_favorites" ADD COLUMN "created_at" TIMESTAMP;
ALTER TABLE "performer_favorites" ALTER "created_at" SET DEFAULT NOW();
ALTER TABLE "studio_favorites" ADD COLUMN "created_at" TIMESTAMP;
ALTER TABLE "studio_favorites" ALTER "created_at" SET DEFAULT NOW();
