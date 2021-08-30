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

func (p Studio) GetID() uuid.UUID {
	return p.ID
}

type Studios []*Studio

func (p Studios) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Studios) Add(o interface{}) {
	*p = append(*p, o.(*Studio))
}

type StudioURL struct {
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
	URL      string    `db:"url" json:"url"`
	Type     string    `db:"type" json:"type"`
}

func (p *StudioURL) ToURL() URL {
	url := URL{
		URL:  p.URL,
		Type: p.Type,
	}
	return url
}

type PerformerStudio struct {
	SceneCount int `db:"count" json:"scene_count"`
	Studio
}

type StudioURLs []*StudioURL

func (p StudioURLs) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *StudioURLs) Add(o interface{}) {
	*p = append(*p, (o.(*StudioURL)))
}

func CreateStudioURLs(studioID uuid.UUID, urls []*URLInput) StudioURLs {
	var ret StudioURLs

	for _, urlInput := range urls {
		ret = append(ret, &StudioURL{
			StudioID: studioID,
			URL:      urlInput.URL,
			Type:     urlInput.Type,
		})
	}

	return ret
}

func (p *Studio) IsEditTarget() {
}

func (p *Studio) CopyFromCreateInput(input StudioCreateInput) {
	CopyFull(p, input)

	if input.ParentID != nil {
		UUID, err := uuid.FromString(*input.ParentID)
		if err == nil {
			p.ParentStudioID = uuid.NullUUID{UUID: UUID, Valid: true}
		}
	}
}

func (p *Studio) CopyFromUpdateInput(input StudioUpdateInput) {
	CopyFull(p, input)

	if input.ParentID != nil {
		UUID, err := uuid.FromString(*input.ParentID)
		if err == nil {
			p.ParentStudioID = uuid.NullUUID{UUID: UUID, Valid: true}
		}
	} else {
		p.ParentStudioID = uuid.NullUUID{}
	}
}

func (p *Studio) CopyFromStudioEdit(input StudioEdit, existing *StudioEdit) {
	fe := fromEdit{}
	fe.string(&p.Name, input.Name)
	fe.nullUUID(&p.ParentStudioID, input.ParentID, existing.ParentID)
}

func (p *Studio) ValidateModifyEdit(edit StudioEditData) error {
	v := editValidator{}

	v.string("name", edit.Old.Name, p.Name)
	v.uuid("ParentID", edit.Old.ParentID, p.ParentStudioID)

	return nil
}

func CreateStudioImages(studioID uuid.UUID, imageIds []string) StudiosImages {
	var imageJoins StudiosImages
	for _, iid := range imageIds {
		imageID := uuid.FromStringOrNil(iid)
		imageJoin := &StudioImage{
			StudioID: studioID,
			ImageID:  imageID,
		}
		imageJoins = append(imageJoins, imageJoin)
	}

	return imageJoins
}
