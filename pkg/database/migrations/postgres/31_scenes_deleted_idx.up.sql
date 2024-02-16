CREATE INDEX "scenes_deleted_idx" ON "scenes"("deleted");
CREATE INDEX "scenes_id_deleted_idx" ON "scenes"("id", "deleted");
CREATE INDEX "studio_favorites_idx" ON "studio_favorites"("studio_id", "user_id");
CREATE INDEX "performer_favorites_idx" ON "performer_favorites"("performer_id", "user_id");
