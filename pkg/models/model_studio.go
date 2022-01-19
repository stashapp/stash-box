package models

import (
	"github.com/gofrs/uuid"
)

type Studio struct {
	ID             uuid.UUID       `db:"id" json:"id"`
	Name           string          `db:"name" json:"name"`
	ParentStudioID uuid.NullUUID   `db:"parent_studio_id,omitempty" json:"parent_studio_id"`
	CreatedAt      SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt      SQLiteTimestamp `db:"updated_at" json:"updated_at"`
	Deleted        bool            `db:"deleted" json:"deleted"`
}

func (Studio) IsSceneDraftStudio() {}

func (s Studio) GetID() uuid.UUID {
	return s.ID
}

type Studios []*Studio

func (s Studios) Each(fn func(interface{})) {
	for _, v := range s {
		fn(*v)
	}
}

func (s *Studios) Add(o interface{}) {
	*s = append(*s, o.(*Studio))
}

type StudioURL struct {
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
	SiteID   uuid.UUID `db:"site_id" json:"site_id"`
	URL      string    `db:"url" json:"url"`
}

func (s StudioURL) ID() string {
	return s.URL
}

func (s *StudioURL) ToURL() URL {
	url := URL{
		URL:    s.URL,
		SiteID: s.SiteID,
	}
	return url
}

type PerformerStudio struct {
	SceneCount int `db:"count" json:"scene_count"`
	Studio
}

type StudioURLs []*StudioURL

func (s StudioURLs) Each(fn func(interface{})) {
	for _, v := range s {
		fn(*v)
	}
}

func (s StudioURLs) EachPtr(fn func(interface{})) {
	for _, v := range s {
		fn(v)
	}
}

func (s *StudioURLs) Add(o interface{}) {
	*s = append(*s, (o.(*StudioURL)))
}

func (s *StudioURLs) Remove(id string) {
	for i, v := range *s {
		if v.ID() == id {
			(*s)[i] = (*s)[len(*s)-1]
			*s = (*s)[:len(*s)-1]
			break
		}
	}
}

func CreateStudioURLs(studioID uuid.UUID, urls []*URL) StudioURLs {
	var ret StudioURLs

	for _, urlInput := range urls {
		ret = append(ret, &StudioURL{
			StudioID: studioID,
			URL:      urlInput.URL,
			SiteID:   urlInput.SiteID,
		})
	}

	return ret
}

func (s *Studio) IsEditTarget() {
}

func (s *Studio) CopyFromCreateInput(input StudioCreateInput) {
	CopyFull(s, input)

	if input.ParentID != nil {
		s.ParentStudioID = uuid.NullUUID{UUID: *input.ParentID, Valid: true}
	}
}

func (s *Studio) CopyFromUpdateInput(input StudioUpdateInput) {
	CopyFull(s, input)

	if input.ParentID != nil {
		s.ParentStudioID = uuid.NullUUID{UUID: *input.ParentID, Valid: true}
	} else {
		s.ParentStudioID = uuid.NullUUID{}
	}
}

func (s *Studio) CopyFromStudioEdit(input StudioEdit, existing *StudioEdit) {
	fe := fromEdit{}
	fe.string(&s.Name, input.Name)
	fe.nullUUID(&s.ParentStudioID, input.ParentID, existing.ParentID)
}

func (s *Studio) ValidateModifyEdit(edit StudioEditData) error {
	v := editValidator{}

	v.string("name", edit.Old.Name, s.Name)
	v.uuid("ParentID", edit.Old.ParentID, s.ParentStudioID)

	return v.err
}

func CreateStudioImages(studioID uuid.UUID, imageIds []uuid.UUID) StudiosImages {
	var imageJoins StudiosImages
	for _, iid := range imageIds {
		imageJoin := &StudioImage{
			StudioID: studioID,
			ImageID:  iid,
		}
		imageJoins = append(imageJoins, imageJoin)
	}

	return imageJoins
}
