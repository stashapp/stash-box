package models

import (
	"database/sql"
	"github.com/satori/go.uuid"

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
	PerformerID uuid.UUID      `db:"performer_id" json:"performer_id"`
	As          sql.NullString `db:"as" json:"as"`
	SceneID     uuid.UUID      `db:"scene_id" json:"scene_id"`
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
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	TagID   uuid.UUID `db:"tag_id" json:"tag_id"`
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
