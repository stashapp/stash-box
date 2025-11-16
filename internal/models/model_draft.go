package models

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
)

type Draft struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	UserID    uuid.UUID       `db:"user_id" json:"user_id"`
	Type      string          `db:"type" json:"type"`
	Data      json.RawMessage `db:"data" json:"data"`
	CreatedAt time.Time       `db:"created_at" json:"created_at"`
}

type DraftEntity struct {
	Name string     `json:"name"`
	ID   *uuid.UUID `json:"id,omitempty"`
}

func (DraftEntity) IsSceneDraftTag()       {}
func (DraftEntity) IsSceneDraftPerformer() {}
func (DraftEntity) IsSceneDraftStudio()    {}

type SceneDraft struct {
	ID             *uuid.UUID         `json:"id,omitempty"`
	Title          *string            `json:"title,omitempty"`
	Code           *string            `json:"code,omitempty"`
	Details        *string            `json:"details,omitempty"`
	Director       *string            `json:"director,omitempty"`
	URLs           []string           `json:"urls,omitempty"`
	Date           *string            `json:"date,omitempty"`
	ProductionDate *string            `json:"production_date,omitempty"`
	Studio         *DraftEntity       `json:"studio,omitempty"`
	Performers     []DraftEntity      `json:"performers,omitempty"`
	Tags           []DraftEntity      `json:"tags,omitempty"`
	Image          *uuid.UUID         `json:"image,omitempty"`
	Fingerprints   []DraftFingerprint `json:"fingerprints"`
}

func (SceneDraft) IsDraftData() {}

type PerformerDraft struct {
	ID              *uuid.UUID `json:"id,omitempty"`
	Name            string     `json:"name"`
	Disambiguation  *string    `json:"disambiguation,omitempty"`
	Aliases         *string    `json:"aliases,omitempty"`
	Gender          *string    `json:"gender,omitempty"`
	Birthdate       *string    `json:"birthdate,omitempty"`
	Deathdate       *string    `json:"deathdate,omitempty"`
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
