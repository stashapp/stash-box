package models

import (
	"fmt"
	"time"

	"github.com/gofrs/uuid"
)

type Studio struct {
	ID             uuid.UUID     `db:"id" json:"id"`
	Name           string        `db:"name" json:"name"`
	ParentStudioID uuid.NullUUID `db:"parent_studio_id,omitempty" json:"parent_studio_id"`
	CreatedAt      time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time     `db:"updated_at" json:"updated_at"`
	Deleted        bool          `db:"deleted" json:"deleted"`
}

func (Studio) IsSceneDraftStudio() {}

func (s Studio) GetID() uuid.UUID {
	return s.ID
}

func (s Studio) IsDeleted() bool {
	return s.Deleted
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

type StudioAlias struct {
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
	Alias    string    `db:"alias" json:"alias"`
}

func (p StudioAlias) ID() string {
	return p.Alias
}

type StudioAliases []*StudioAlias

func (p StudioAliases) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p StudioAliases) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *StudioAliases) Add(o interface{}) {
	*p = append(*p, o.(*StudioAlias))
}

func (p StudioAliases) ToAliases() []string {
	var ret []string
	for _, v := range p {
		ret = append(ret, v.Alias)
	}

	return ret
}

func (p *StudioAliases) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

func (p *StudioAliases) AddAliases(newAliases []*StudioAlias) error {
	aliasMap := map[string]bool{}
	for _, x := range *p {
		aliasMap[x.Alias] = true
	}
	for _, v := range newAliases {
		if aliasMap[v.Alias] {
			return fmt.Errorf("Invalid alias addition. Alias already exists: '%v'", v.Alias)
		}
	}
	for _, v := range newAliases {
		p.Add(v)
	}
	return nil
}

func (p *StudioAliases) RemoveAliases(oldAliases []string) error {
	aliasMap := map[string]bool{}
	for _, x := range *p {
		aliasMap[x.Alias] = true
	}
	for _, v := range oldAliases {
		if !aliasMap[v] {
			return fmt.Errorf("Invalid alias removal. Alias does not exist: '%v'", v)
		}
	}
	for _, v := range oldAliases {
		p.Remove(v)
	}
	return nil
}

func CreateStudioAliases(studioID uuid.UUID, aliases []string) StudioAliases {
	var ret StudioAliases

	for _, alias := range aliases {
		ret = append(ret, &StudioAlias{StudioID: studioID, Alias: alias})
	}

	return ret
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
