ALTER TABLE "performer_edits"
  DROP CONSTRAINT "performer_edits_edit_id_fkey",
  DROP CONSTRAINT "performer_edits_performer_id_fkey",
  ADD CONSTRAINT "performer_edits_edit_id_fkey"
    FOREIGN KEY ("edit_id") REFERENCES "edits"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "performer_edits_performer_id_fkey"
    FOREIGN KEY ("performer_id") REFERENCES "performers"("id") ON DELETE CASCADE;

ALTER TABLE "studio_edits"
  DROP CONSTRAINT "studio_edits_edit_id_fkey",
  DROP CONSTRAINT "studio_edits_studio_id_fkey",
  ADD CONSTRAINT "studio_edits_edit_id_fkey"
    FOREIGN KEY ("edit_id") REFERENCES "edits"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "studio_edits_studio_id_fkey"
    FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE;

ALTER TABLE "tag_edits"
  DROP CONSTRAINT "tag_edits_edit_id_fkey",
  DROP CONSTRAINT "tag_edits_tag_id_fkey",
  ADD CONSTRAINT "tag_edits_edit_id_fkey"
    FOREIGN KEY ("edit_id") REFERENCES "edits"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "tag_edits_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;

ALTER TABLE "scene_edits"
  DROP CONSTRAINT "scene_edits_edit_id_fkey",
  DROP CONSTRAINT "scene_edits_scene_id_fkey",
  ADD CONSTRAINT "scene_edits_edit_id_fkey"
    FOREIGN KEY ("edit_id") REFERENCES "edits"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "scene_edits_scene_id_fkey"
    FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE;
