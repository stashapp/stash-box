package models

import (
	"bytes"
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"
)

type Draft struct {
	ID        uuid.UUID      `db:"id" json:"id"`
	UserID    uuid.UUID      `db:"user_id" json:"user_id"`
	Type      string         `db:"type" json:"type"`
	Data      types.JSONText `db:"data" json:"data"`
	CreatedAt time.Time      `db:"created_at" json:"created_at"`
}

type DraftEntity struct {
	Name string     `json:"name"`
	ID   *uuid.UUID `json:"id,omitempty"`
}

func (DraftEntity) IsSceneDraftTag()       {}
func (DraftEntity) IsSceneDraftPerformer() {}
func (DraftEntity) IsSceneDraftStudio()    {}

type SceneDraft struct {
	ID           *uuid.UUID         `json:"id,omitempty"`
	Title        *string            `json:"title,omitempty"`
	Details      *string            `json:"details,omitempty"`
	URL          *string            `json:"url,omitempty"`
	Date         *string            `json:"date,omitempty"`
	Studio       *DraftEntity       `json:"studio,omitempty"`
	Performers   []DraftEntity      `json:"performers,omitempty"`
	Tags         []DraftEntity      `json:"tags,omitempty"`
	Image        *uuid.UUID         `json:"image,omitempty"`
	Fingerprints []DraftFingerprint `json:"fingerprints"`
}

func (SceneDraft) IsDraftData() {}

type PerformerDraft struct {
	ID              *uuid.UUID `json:"id,omitempty"`
	Name            string     `json:"name"`
	Aliases         *string    `json:"aliases,omitempty"`
	Gender          *string    `json:"gender,omitempty"`
	Birthdate       *string    `json:"birthdate,omitempty"`
	Urls            []string   `json:"urls,omitempty"`
	Ethnicity       *string    `json:"ethnicity,omitempty"`
	Country         *string    `json:"country,omitempty"`
	EyeColor        *string    `json:"eye_color,omitempty"`
	HairColor       *string    `json:"hair_color,omitempty"`
	Height          *string    `json:"height,omitempty"`
	Measurements    *string    `json:"measurements,omitempty"`
	BreastType      *string    `json:"breast_type,omitempty"`
	Tattoos         *string    `json:"tattoos,omitempty"`
	Piercings       *string    `json:"piercings,omitempty"`
	CareerStartYear *int       `json:"career_start_year,omitempty"`
	CareerEndYear   *int       `json:"career_end_year,omitempty"`
	Image           *uuid.UUID `json:"image,omitempty"`
}

func (PerformerDraft) IsDraftData() {}

func NewDraft(id uuid.UUID, user *User, targetType TargetTypeEnum) *Draft {
	ret := &Draft{
		ID:        id,
		UserID:    user.ID,
		Type:      targetType.String(),
		CreatedAt: time.Now(),
	}

	return ret
}

func (e *Draft) SetData(data interface{}) error {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		return err
	}
	e.Data = buffer.Bytes()
	return nil
}

func (e *Draft) GetPerformerData() (*PerformerDraft, error) {
	data := PerformerDraft{}
	err := json.Unmarshal(e.Data, &data)
	return &data, err
}

func (e *Draft) GetSceneData() (*SceneDraft, error) {
	data := SceneDraft{}
	err := json.Unmarshal(e.Data, &data)
	return &data, err
}

func (e Draft) GetID() uuid.UUID {
	return e.ID
}

type Drafts []*Draft

func (p Drafts) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Drafts) Add(o interface{}) {
	*p = append(*p, o.(*Draft))
}
