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

func (s PerformerScene) ID() string {
	return s.PerformerID.String() + s.As.String
}

type PerformersScenes []*PerformerScene

func (p PerformersScenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p PerformersScenes) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformersScenes) Add(o interface{}) {
	*p = append(*p, o.(*PerformerScene))
}

func (p *PerformersScenes) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

type SceneTag struct {
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	TagID   uuid.UUID `db:"tag_id" json:"tag_id"`
}

func (p SceneTag) ID() string {
	return p.TagID.String()
}

type ScenesTags []*SceneTag

func (p ScenesTags) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p ScenesTags) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *ScenesTags) Add(o interface{}) {
	*p = append(*p, o.(*SceneTag))
}

func (p *ScenesTags) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

type SceneImage struct {
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	ImageID uuid.UUID `db:"image_id" json:"image_id"`
}

func (p SceneImage) ID() string {
	return p.ImageID.String()
}

type ScenesImages []*SceneImage

func (p ScenesImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p ScenesImages) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *ScenesImages) Add(o interface{}) {
	*p = append(*p, o.(*SceneImage))
}

func (p *ScenesImages) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
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
		if v.ID() == id {
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

func (s StudioImage) ID() string {
	return s.ImageID.String()
}

type StudiosImages []*StudioImage

func (p StudiosImages) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p StudiosImages) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *StudiosImages) Add(o interface{}) {
	*p = append(*p, o.(*StudioImage))
}

func (p *StudiosImages) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

type URL struct {
	URL    string `json:"url"`
	SiteID uuid.UUID
}

type URLInput struct {
	URL    string    `json:"url"`
	SiteID uuid.UUID `json:"site_id"`
}

func (u *URLInput) ToURL() *URL {
	return &URL{URL: u.URL, SiteID: u.SiteID}
}

func ParseURLInput(input []*URLInput) []*URL {
	var ret []*URL
	for _, url := range input {
		convertedURL := url.ToURL()
		if convertedURL != nil {
			ret = append(ret, convertedURL)
		}
	}
	return ret
}

type PerformerFavorite struct {
	PerformerID uuid.UUID    `db:"performer_id" json:"performer_id"`
	UserID      uuid.UUID    `db:"user_id" json:"user_id"`
	CreatedAt   sql.NullTime `db:"created_at" json:"created_at"`
}

type StudioFavorite struct {
	StudioID  uuid.UUID    `db:"studio_id" json:"studio_id"`
	UserID    uuid.UUID    `db:"user_id" json:"user_id"`
	CreatedAt sql.NullTime `db:"created_at" json:"created_at"`
}

type UserNotification struct {
	UserID uuid.UUID        `db:"user_id" json:"user_id"`
	Type   NotificationEnum `db:"type" json:"type"`
}

type UserNotifications []*UserNotification

func (u *UserNotifications) Add(o interface{}) {
	*u = append(*u, o.(*UserNotification))
}

func (u UserNotifications) Each(fn func(interface{})) {
	for _, v := range u {
		fn(*v)
	}
}

func CreateUserNotifications(userID uuid.UUID, subscriptions []NotificationEnum) UserNotifications {
	var ret UserNotifications

	for _, sub := range subscriptions {
		ret = append(ret, &UserNotification{
			UserID: userID,
			Type:   sub,
		})
	}

	return ret
}
