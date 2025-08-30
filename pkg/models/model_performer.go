package models

import (
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models/assign"
	"github.com/stashapp/stash-box/pkg/models/validator"
)

type Performer struct {
	ID              uuid.UUID       `json:"id"`
	Name            string          `json:"name"`
	Disambiguation  *string         `json:"disambiguation,omitempty"`
	Gender          *GenderEnum     `json:"gender,omitempty"`
	BirthDate       *string         `json:"birth_date,omitempty"`
	DeathDate       *string         `json:"death_date,omitempty"`
	Ethnicity       *EthnicityEnum  `json:"ethnicity,omitempty"`
	Country         *string         `json:"country,omitempty"`
	EyeColor        *EyeColorEnum   `json:"eye_color,omitempty"`
	HairColor       *HairColorEnum  `json:"hair_color,omitempty"`
	Height          *int            `json:"height,omitempty"`
	CupSize         *string         `json:"cup_size,omitempty"`
	BandSize        *int            `json:"band_size,omitempty"`
	WaistSize       *int            `json:"waist_size,omitempty"`
	HipSize         *int            `json:"hip_size,omitempty"`
	BreastType      *BreastTypeEnum `json:"breast_type,omitempty"`
	CareerStartYear *int            `json:"career_start_year,omitempty"`
	CareerEndYear   *int            `json:"career_end_year,omitempty"`
	Deleted         bool            `json:"deleted"`
	Created         time.Time       `json:"created"`
	Updated         time.Time       `json:"updated"`
}

func (Performer) IsSceneDraftPerformer() {}
func (p *Performer) IsEditTarget()       {}

type PerformerQuery struct {
	Filter PerformerQueryInput
}

type QueryExistingPerformerResult struct {
	Input QueryExistingPerformerInput
}

func (p Performer) IsDeleted() bool {
	return p.Deleted
}

func (p *Performer) CopyFromPerformerEdit(input PerformerEdit, old PerformerEdit) {
	assign.String(&p.Name, input.Name)
	assign.StringPtr(&p.Disambiguation, input.Disambiguation, old.Disambiguation)
	assign.EnumPtr[GenderEnum](&p.Gender, input.Gender, old.Gender)
	assign.EnumPtr[EthnicityEnum](&p.Ethnicity, input.Ethnicity, old.Ethnicity)
	assign.StringPtr(&p.Country, input.Country, old.Country)
	assign.EnumPtr[EyeColorEnum](&p.EyeColor, input.EyeColor, old.EyeColor)
	assign.EnumPtr[HairColorEnum](&p.HairColor, input.HairColor, old.HairColor)
	assign.IntPtr(&p.Height, input.Height, old.Height)
	assign.EnumPtr[BreastTypeEnum](&p.BreastType, input.BreastType, old.BreastType)
	assign.IntPtr(&p.CareerStartYear, input.CareerStartYear, old.CareerStartYear)
	assign.IntPtr(&p.CareerEndYear, input.CareerEndYear, old.CareerEndYear)
	assign.StringPtr(&p.CupSize, input.CupSize, old.CupSize)
	assign.IntPtr(&p.BandSize, input.BandSize, old.BandSize)
	assign.IntPtr(&p.HipSize, input.HipSize, old.HipSize)
	assign.IntPtr(&p.WaistSize, input.WaistSize, old.WaistSize)
	assign.StringPtr(&p.BirthDate, input.Birthdate, old.Birthdate)
	assign.StringPtr(&p.DeathDate, input.Deathdate, old.Deathdate)

	p.Updated = time.Now()
}

func (p *Performer) ValidateModifyEdit(edit PerformerEditData) error {
	if err := validator.String("name", edit.Old.Name, p.Name); err != nil {
		return err
	}
	if err := validator.StringPtr("disambiguation", edit.Old.Disambiguation, p.Disambiguation); err != nil {
		return err
	}
	if err := validator.EnumPtr[GenderEnum]("gender", edit.Old.Gender, p.Gender); err != nil {
		return err
	}
	if err := validator.EnumPtr[EthnicityEnum]("ethnicity", edit.Old.Ethnicity, p.Ethnicity); err != nil {
		return err
	}
	if err := validator.StringPtr("country", edit.Old.Country, p.Country); err != nil {
		return err
	}
	if err := validator.EnumPtr[EyeColorEnum]("eye color", edit.Old.EyeColor, p.EyeColor); err != nil {
		return err
	}
	if err := validator.EnumPtr[HairColorEnum]("hair color", edit.Old.HairColor, p.HairColor); err != nil {
		return err
	}
	if err := validator.IntPtr("height", edit.Old.Height, p.Height); err != nil {
		return err
	}
	if err := validator.EnumPtr[BreastTypeEnum]("breast type", edit.Old.BreastType, p.BreastType); err != nil {
		return err
	}
	if err := validator.IntPtr("career start year", edit.Old.CareerStartYear, p.CareerStartYear); err != nil {
		return err
	}
	if err := validator.IntPtr("career end year", edit.Old.CareerEndYear, p.CareerEndYear); err != nil {
		return err
	}
	if err := validator.StringPtr("cup size", edit.Old.CupSize, p.CupSize); err != nil {
		return err
	}
	if err := validator.IntPtr("band size", edit.Old.BandSize, p.BandSize); err != nil {
		return err
	}
	if err := validator.IntPtr("hip size", edit.Old.HipSize, p.HipSize); err != nil {
		return err
	}
	if err := validator.IntPtr("waist size", edit.Old.WaistSize, p.WaistSize); err != nil {
		return err
	}
	if err := validator.StringPtr("birthdate", edit.Old.Birthdate, p.BirthDate); err != nil {
		return err
	}
	return validator.StringPtr("deathdate", edit.Old.Deathdate, p.DeathDate)
}
