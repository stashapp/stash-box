CREATE INDEX scenes_deleted_duration_id_idx ON scenes (duration DESC NULLS LAST, id DESC) WHERE deleted = false;
