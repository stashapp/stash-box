package models

import (
	"database/sql"

	"github.com/gofrs/uuid"
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

type ScenesImages []*SceneImage

func (p ScenesImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *ScenesImages) Add(o interface{}) {
	*p = append(*p, o.(*SceneImage))
}

type PerformerImage struct {
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
	ImageID     uuid.UUID `db:"image_id" json:"image_id"`
}

func (p PerformerImage) ID() string {
	return p.ImageID.String()
}

type PerformersImages []*PerformerImage

func (p PerformersImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *PerformersImages) Add(o interface{}) {
	*p = append(*p, o.(*PerformerImage))
}

func (p PerformersImages) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformersImages) Remove(id string) {
	for i, v := range *p {
		if (*v).ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

type StudioImage struct {
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
	ImageID  uuid.UUID `db:"image_id" json:"image_id"`
}

type StudiosImages []*StudioImage

func (p StudiosImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *StudiosImages) Add(o interface{}) {
	*p = append(*p, o.(*StudioImage))
}

type URL struct {
	URL  string `json:"url"`
	Type string `json:"type"`
}

type URLInput = URL
