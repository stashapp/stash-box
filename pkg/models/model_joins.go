package models

import "database/sql"

type PerformersScenes struct {
	PerformerID int64          `db:"performer_id" json:"performer_id"`
	As          sql.NullString `db:"as" json:"as"`
	SceneID     int64          `db:"scene_id" json:"scene_id"`
}

type ScenesTags struct {
	SceneID int64 `db:"scene_id" json:"scene_id"`
	TagID   int64 `db:"tag_id" json:"tag_id"`
}

type SceneMarkersTags struct {
	SceneMarkerID int64 `db:"scene_marker_id" json:"scene_marker_id"`
	TagID         int64 `db:"tag_id" json:"tag_id"`
}
