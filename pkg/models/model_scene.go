package models

import (
	"database/sql"
	"strconv"
)

type Scene struct {
	ID        int64           `db:"id" json:"id"`
	Title     sql.NullString  `db:"title" json:"title"`
	Details   sql.NullString  `db:"details" json:"details"`
	URL       sql.NullString  `db:"url" json:"url"`
	Date      SQLiteDate      `db:"date" json:"date"`
	StudioID  sql.NullInt64   `db:"studio_id,omitempty" json:"studio_id"`
	CreatedAt SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type SceneChecksum struct {
	SceneID  int64  `db:"scene_id" json:"scene_id"`
	Checksum string `db:"checksum" json:"checksum"`
}

func CreateSceneChecksums(sceneID int64, checksums []string) []SceneChecksum {
	var ret []SceneChecksum

	for _, checksum := range checksums {
		ret = append(ret, SceneChecksum{SceneID: sceneID, Checksum: checksum})
	}

	return ret
}

func CreateSceneTags(sceneID int64, tagIds []string) []ScenesTags {
	var tagJoins []ScenesTags
	for _, tid := range tagIds {
		tagID, _ := strconv.ParseInt(tid, 10, 64)
		tagJoin := ScenesTags{
			SceneID: sceneID,
			TagID:   tagID,
		}
		tagJoins = append(tagJoins, tagJoin)
	}

	return tagJoins
}

func CreateScenePerformers(sceneID int64, appearances []*PerformerAppearanceInput) []PerformersScenes {
	var performerJoins []PerformersScenes
	for _, a := range appearances {
		performerID, _ := strconv.ParseInt(a.PerformerID, 10, 64)
		performerJoin := PerformersScenes{
			SceneID:     sceneID,
			PerformerID: performerID,
		}

		if a.As != nil {
			performerJoin.As = sql.NullString{Valid: true, String: *a.As}
		}

		performerJoins = append(performerJoins, performerJoin)
	}

	return performerJoins
}

func (p *Scene) IsEditTarget() {
}

func (p *Scene) setDate(date string) {
	p.Date = SQLiteDate{String: date, Valid: true}
}

func (p *Scene) CopyFromCreateInput(input SceneCreateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}

func (p *Scene) CopyFromUpdateInput(input SceneUpdateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}
