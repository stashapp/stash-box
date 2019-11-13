package models

import (
	"database/sql"
)

type Performer struct {
	ID                int64           `db:"id" json:"id"`
	Name              string          `db:"name" json:"name"`
	Disambiguation    sql.NullString  `db:"disambiguation" json:"disambiguation"`
	Image             []byte          `db:"image" json:"image"`
	Gender            sql.NullString  `db:"gender" json:"gender"`
	Birthdate         SQLiteDate      `db:"birthdate" json:"birthdate"`
	BirthdateAccuracy sql.NullString  `db:"birthdate_accuracy" json:"birthdate_accuracy"`
	Ethnicity         sql.NullString  `db:"ethnicity" json:"ethnicity"`
	Country           sql.NullString  `db:"country" json:"country"`
	EyeColor          sql.NullString  `db:"eye_color" json:"eye_color"`
	HairColor         sql.NullString  `db:"hair_color" json:"hair_color"`
	Height            sql.NullInt64   `db:"height" json:"height"`
	CupSize           sql.NullString  `db:"cup_size" json:"cup_size"`
	BandSize          sql.NullInt64   `db:"band_size" json:"band_size"`
	WaistSize         sql.NullInt64   `db:"waist_size" json:"waist_size"`
	HipSize           sql.NullInt64   `db:"hip_size" json:"hip_size"`
	BreastType        sql.NullString  `db:"breast_type" json:"breast_type"`
	CareerStartYear   sql.NullInt64   `db:"career_start_year" json:"career_start_year"`
	CareerEndYear     sql.NullInt64   `db:"career_end_year" json:"career_end_year"`
	CreatedAt         SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt         SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type PerformerAliases struct {
	PerformerID int64  `db:"performer_id" json:"performer_id"`
	Alias       string `db:"alias" json:"alias"`
}

func CreatePerformerAliases(performerId int64, aliases []string) []PerformerAliases {
	var ret []PerformerAliases

	for _, alias := range aliases {
		ret = append(ret, PerformerAliases{PerformerID: performerId, Alias: alias})
	}

	return ret
}

type PerformerUrls struct {
	PerformerID int64  `db:"performer_id" json:"performer_id"`
	URL         string `db:"url" json:"url"`
	Type        string `db:"type" json:"type"`
}

func (p *PerformerUrls) ToURL() URL {
	return URL{
		URL:  p.URL,
		Type: p.Type,
	}
}

func CreatePerformerUrls(performerId int64, urls []*URLInput) []PerformerUrls {
	var ret []PerformerUrls

	for _, urlInput := range urls {
		ret = append(ret, PerformerUrls{
			PerformerID: performerId,
			URL:         urlInput.URL,
			Type:        urlInput.Type,
		})
	}

	return ret
}

type PerformerBodyMods struct {
	PerformerID int64          `db:"performer_id" json:"performer_id"`
	Location    string         `db:"location" json:"location"`
	Description sql.NullString `db:"description" json:"description"`
}

func (m PerformerBodyMods) ToBodyModification() BodyModification {
	ret := BodyModification{
		Location: m.Location,
	}
	if m.Description.Valid {
		ret.Description = &(m.Description.String)
	}

	return ret
}

func CreatePerformerBodyMods(performerId int64, urls []*BodyModificationInput) []PerformerBodyMods {
	var ret []PerformerBodyMods

	for _, bmInput := range urls {
		description := sql.NullString{}

		if bmInput.Description != nil {
			description.String = *bmInput.Description
			description.Valid = true
		}
		ret = append(ret, PerformerBodyMods{
			PerformerID: performerId,
			Location:    bmInput.Location,
			Description: description,
		})
	}

	return ret
}

func (p *Performer) IsEditTarget() {
}

func (p *Performer) setBirthdate(fuzzyDate FuzzyDateInput) {
	p.Birthdate = SQLiteDate{String: fuzzyDate.Date, Valid: true}
	p.BirthdateAccuracy = sql.NullString{String: fuzzyDate.Accuracy.String(), Valid: true}
}

func (p Performer) ResolveBirthdate() FuzzyDate {
	ret := FuzzyDate{}

	if p.Birthdate.Valid {
		ret.Date = p.Birthdate.String
	}
	if p.BirthdateAccuracy.Valid {
		ret.Accuracy = DateAccuracyEnum(p.BirthdateAccuracy.String)
		if !ret.Accuracy.IsValid() {
			ret.Accuracy = ""
		}
	}

	return ret
}

func (p *Performer) setMeasurements(measurements MeasurementsInput) {
	if measurements.CupSize != nil {
		p.CupSize = sql.NullString{String: *measurements.CupSize, Valid: true}
	}
	if measurements.BandSize != nil {
		p.BandSize = sql.NullInt64{Int64: int64(*measurements.BandSize), Valid: true}
	}
	if measurements.Hip != nil {
		p.HipSize = sql.NullInt64{Int64: int64(*measurements.Hip), Valid: true}
	}
	if measurements.Waist != nil {
		p.WaistSize = sql.NullInt64{Int64: int64(*measurements.Waist), Valid: true}
	}
}

func (p Performer) ResolveMeasurements() Measurements {
	ret := Measurements{}

	if p.CupSize.Valid {
		ret.CupSize = &p.CupSize.String
	}
	if p.BandSize.Valid {
		i := int(p.BandSize.Int64)
		ret.BandSize = &i
	}
	if p.HipSize.Valid {
		i := int(p.HipSize.Int64)
		ret.Hip = &i
	}
	if p.WaistSize.Valid {
		i := int(p.WaistSize.Int64)
		ret.Waist = &i
	}

	return ret
}

func (p *Performer) CopyFromCreateInput(input PerformerCreateInput) {
	CopyFull(p, input)

	if input.Birthdate != nil {
		p.setBirthdate(*input.Birthdate)
	}

	if input.Measurements != nil {
		p.setMeasurements(*input.Measurements)
	}
}

func (p *Performer) CopyFromUpdateInput(input PerformerUpdateInput) {
	CopyFull(p, input)

	if input.Birthdate != nil {
		p.setBirthdate(*input.Birthdate)
	}

	if input.Measurements != nil {
		p.setMeasurements(*input.Measurements)
	}
}
