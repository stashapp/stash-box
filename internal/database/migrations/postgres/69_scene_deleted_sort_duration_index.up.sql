CREATE INDEX scenes_deleted_duration_id_idx ON scenes (duration DESC, id DESC) WHERE deleted = false;
