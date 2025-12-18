DROP INDEX scenes_created_idx;
DROP INDEX scenes_deleted_idx;
DROP INDEX scenes_id_deleted_idx;

CREATE INDEX scenes_deleted_created_at_id_idx ON scenes (created_at DESC, id DESC) WHERE deleted = false;
CREATE INDEX scenes_deleted_updated_at_id_idx ON scenes (updated_at DESC, id DESC) WHERE deleted = false;
CREATE INDEX scenes_deleted_date_id_idx ON scenes (date DESC, id DESC) WHERE deleted = false;
CREATE INDEX scenes_deleted_title_id_idx ON scenes (title, id DESC) WHERE deleted = false;
