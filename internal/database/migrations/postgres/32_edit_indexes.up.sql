CREATE INDEX "edit_votes_user_edit_idx" ON "edit_votes" ("user_id", "edit_id");
CREATE INDEX "edit_status_idx" ON edits ("status");
CREATE INDEX "edit_comments_edit_idx" ON "edit_comments" ("edit_id");
CREATE INDEX "scene_edits_scene_idx" ON "scene_edits" ("scene_id");
CREATE INDEX "scene_edits_edit_idx" ON "scene_edits" ("edit_id");
CREATE INDEX "performer_edits_edit_idx" ON "performer_edits" ("edit_id");
CREATE INDEX "tag_edits_edit_idx" ON "tag_edits" ("edit_id");
CREATE INDEX "studio_edits_edit_idx" ON "studio_edits" ("edit_id");
CREATE INDEX "studio_deleted_parent_idx" ON "studios" ("deleted", "parent_studio_id");
