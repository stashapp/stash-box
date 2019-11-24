package models

import (
	"database/sql"
	"strconv"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	sceneTable   = "scenes"
	sceneJoinKey = "scene_id"
)

var (
	sceneDBTable = database.NewTable(sceneTable, func() interface{} {
		return &Scene{}
	})

	sceneChecksumTable = database.NewTableJoin(sceneTable, "scene_checksums", sceneJoinKey, func() interface{} {
		return &SceneChecksum{}
	})
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

func (Scene) GetTable() database.Table {
	return sceneDBTable
}

func (p Scene) GetID() int64 {
	return p.ID
}

type Scenes []*Scene

func (p Scenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Scenes) Add(o interface{}) {
	*p = append(*p, o.(*Scene))
}

type SceneChecksum struct {
	SceneID  int64  `db:"scene_id" json:"scene_id"`
	Checksum string `db:"checksum" json:"checksum"`
}

type SceneChecksums []*SceneChecksum

func (p SceneChecksums) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneChecksums) Add(o interface{}) {
	*p = append(*p, o.(*SceneChecksum))
}

func (p SceneChecksums) ToChecksums() []string {
	var ret []string
	for _, v := range p {
		ret = append(ret, v.Checksum)
	}

	return ret
}

func CreateSceneChecksums(sceneID int64, checksums []string) SceneChecksums {
	var ret SceneChecksums

	for _, checksum := range checksums {
		ret = append(ret, &SceneChecksum{SceneID: sceneID, Checksum: checksum})
	}

	return ret
}

func CreateSceneTags(sceneID int64, tagIds []string) ScenesTags {
	var tagJoins ScenesTags
	for _, tid := range tagIds {
		tagID, _ := strconv.ParseInt(tid, 10, 64)
		tagJoin := &SceneTag{
			SceneID: sceneID,
			TagID:   tagID,
		}
		tagJoins = append(tagJoins, tagJoin)
	}

	return tagJoins
}

func CreateScenePerformers(sceneID int64, appearances []*PerformerAppearanceInput) PerformersScenes {
	var performerJoins PerformersScenes
	for _, a := range appearances {
		performerID, _ := strconv.ParseInt(a.PerformerID, 10, 64)
		performerJoin := &PerformerScene{
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
