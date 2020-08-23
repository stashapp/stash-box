package models

import (
	"database/sql"
	"github.com/gofrs/uuid"

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

	tagSceneTable = database.NewTableJoin(tagTable, "scene_tags", tagJoinKey, func() interface{} {
		return &SceneTag{}
	})

	sceneImageTable = database.NewTableJoin(sceneTable, "scene_images", sceneJoinKey, func() interface{} {
		return &SceneImage{}
	})

	imageSceneTable = sceneImageTable.Inverse(imageJoinKey)

	performerImageTable = database.NewTableJoin(performerTable, "performer_images", performerJoinKey, func() interface{} {
		return &PerformerImage{}
	})

	imagePerformerTable = performerImageTable.Inverse(imageJoinKey)

	studioImageTable = database.NewTableJoin(studioTable, "studio_images", studioJoinKey, func() interface{} {
		return &StudioImage{}
	})

	imageStudioTable = studioImageTable.Inverse(imageJoinKey)
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

type SceneImage struct {
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	ImageID uuid.UUID `db:"image_id" json:"image_id"`
}

type SceneImages []*SceneImage

func (p SceneImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneImages) Add(o interface{}) {
	*p = append(*p, o.(*SceneImage))
}

type PerformerImage struct {
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
	ImageID     uuid.UUID `db:"image_id" json:"image_id"`
}

type PerformerImages []*PerformerImage

func (p PerformerImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *PerformerImages) Add(o interface{}) {
	*p = append(*p, o.(*PerformerImage))
}

type StudioImage struct {
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
	ImageID  uuid.UUID `db:"image_id" json:"image_id"`
}

type StudioImages []*StudioImage

func (p StudioImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *StudioImages) Add(o interface{}) {
	*p = append(*p, o.(*StudioImage))
}
