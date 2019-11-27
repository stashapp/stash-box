package models

import (
	"database/sql"

	"github.com/stashapp/stashdb/pkg/database"
)

var (
	scenePerformerTable = database.NewTableJoin(sceneTable, "scene_performers", sceneJoinKey, func() interface{} {
		return &PerformerScene{}
	})

	performerSceneTable = scenePerformerTable.Inverse(performerJoinKey)

	sceneTagTable = database.NewTableJoin(sceneTable, "scene_tags", sceneJoinKey, func() interface{} {
		return &SceneTag{}
	})

	tagSceneTable = sceneTagTable.Inverse(tagJoinKey)
)

type PerformerScene struct {
	PerformerID int64          `db:"performer_id" json:"performer_id"`
	As          sql.NullString `db:"as" json:"as"`
	SceneID     int64          `db:"scene_id" json:"scene_id"`
}

type PerformersScenes []*PerformerScene

func (p PerformersScenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *PerformersScenes) Add(o interface{}) {
	*p = append(*p, o.(*PerformerScene))
}

type SceneTag struct {
	SceneID int64 `db:"scene_id" json:"scene_id"`
	TagID   int64 `db:"tag_id" json:"tag_id"`
}

type ScenesTags []*SceneTag

func (p ScenesTags) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *ScenesTags) Add(o interface{}) {
	*p = append(*p, o.(*SceneTag))
}
