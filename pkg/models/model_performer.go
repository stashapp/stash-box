package models

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
)

type Performer struct {
	ID                uuid.UUID       `db:"id" json:"id"`
	Name              string          `db:"name" json:"name"`
	Disambiguation    sql.NullString  `db:"disambiguation" json:"disambiguation"`
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
	Deleted           bool            `db:"deleted" json:"deleted"`
}

func (Performer) IsSceneDraftPerformer() {}

func (p Performer) GetID() uuid.UUID {
	return p.ID
}

type Performers []*Performer

func (p Performers) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Performers) Add(o interface{}) {
	*p = append(*p, o.(*Performer))
}

type PerformerAlias struct {
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
	Alias       string    `db:"alias" json:"alias"`
}

func (p PerformerAlias) ID() string {
	return p.Alias
}

type PerformerAliases []*PerformerAlias

func (p PerformerAliases) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p PerformerAliases) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformerAliases) Add(o interface{}) {
	*p = append(*p, o.(*PerformerAlias))
}

func (p PerformerAliases) ToAliases() []string {
	var ret []string
	for _, v := range p {
		ret = append(ret, v.Alias)
	}

	return ret
}

func (p *PerformerAliases) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

func (p *PerformerAliases) AddAliases(newAliases []*PerformerAlias) error {
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

func (p *PerformerAliases) RemoveAliases(oldAliases []string) error {
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

func CreatePerformerAliases(performerID uuid.UUID, aliases []string) PerformerAliases {
	var ret PerformerAliases

	for _, alias := range aliases {
		ret = append(ret, &PerformerAlias{PerformerID: performerID, Alias: alias})
	}

	return ret
}

type PerformerURL struct {
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
	SiteID      uuid.UUID `db:"site_id" json:"site_id"`
	URL         string    `db:"url" json:"url"`
}

func (p *PerformerURL) ToURL() URL {
	url := URL{
		URL:    p.URL,
		SiteID: p.SiteID,
	}
	return url
}

func (p PerformerURL) ID() string {
	return p.URL
}

type PerformerURLs []*PerformerURL

func (p PerformerURLs) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p PerformerURLs) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformerURLs) Add(o interface{}) {
	*p = append(*p, o.(*PerformerURL))
}

func (p *PerformerURLs) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

func CreatePerformerURLs(performerID uuid.UUID, urls []*URL) PerformerURLs {
	var ret PerformerURLs

	for _, urlInput := range urls {
		ret = append(ret, &PerformerURL{
			PerformerID: performerID,
			URL:         urlInput.URL,
			SiteID:      urlInput.SiteID,
		})
	}

	return ret
}

type BodyModification struct {
	Location    string  `json:"location"`
	Description *string `json:"description"`
}

type BodyModificationInput = BodyModification

type PerformerBodyMod struct {
	PerformerID uuid.UUID      `db:"performer_id" json:"performer_id"`
	Location    string         `db:"location" json:"location"`
	Description sql.NullString `db:"description" json:"description"`
}

func (m PerformerBodyMod) ToBodyModification() BodyModification {
	ret := BodyModification{
		Location: m.Location,
	}
	if m.Description.Valid {
		ret.Description = &(m.Description.String)
	}

	return ret
}

func (m PerformerBodyMod) ID() string {
	return m.Location + "-" + m.Description.String
}

type PerformerBodyMods []*PerformerBodyMod

func (p PerformerBodyMods) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p PerformerBodyMods) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformerBodyMods) Add(o interface{}) {
	*p = append(*p, o.(*PerformerBodyMod))
}

func (p *PerformerBodyMods) Remove(id string) {
	for i, v := range *p {
		if v.ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

func (p PerformerBodyMods) ToBodyModifications() []*BodyModification {
	mods := make([]*BodyModification, len(p))
	for i, pmod := range p {
		mod := pmod.ToBodyModification()
		mods[i] = &mod
	}
	return mods
}

func CreatePerformerBodyMods(performerID uuid.UUID, urls []*BodyModification) PerformerBodyMods {
	var ret PerformerBodyMods

	for _, bmInput := range urls {
		description := sql.NullString{}

		if bmInput.Description != nil {
			description.String = *bmInput.Description
			description.Valid = true
		}
		ret = append(ret, &PerformerBodyMod{
			PerformerID: performerID,
			Location:    bmInput.Location,
			Description: description,
		})
	}

	return ret
}

func (p *Performer) IsEditTarget() {
}

func (p *Performer) setBirthdate(fuzzyDate FuzzyDateInput) {
	p.Birthdate = SQLiteDate{String: fuzzyDate.Date, Valid: fuzzyDate.Date != ""}
	p.BirthdateAccuracy = sql.NullString{String: fuzzyDate.Accuracy.String(), Valid: fuzzyDate.Date != ""}
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
		p.CupSize = sql.NullString{String: *measurements.CupSize, Valid: *measurements.CupSize != ""}
	}
	if measurements.BandSize != nil {
		p.BandSize = sql.NullInt64{Int64: int64(*measurements.BandSize), Valid: *measurements.BandSize != 0}
	}
	if measurements.Hip != nil {
		p.HipSize = sql.NullInt64{Int64: int64(*measurements.Hip), Valid: *measurements.Hip != 0}
	}
	if measurements.Waist != nil {
		p.WaistSize = sql.NullInt64{Int64: int64(*measurements.Waist), Valid: *measurements.Waist != 0}
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

func (p *Performer) CopyFromCreateInput(input PerformerCreateInput) error {
	CopyFull(p, input)

	if input.Birthdate != nil {
		p.setBirthdate(*input.Birthdate)
	}

	if input.Measurements != nil {
		p.setMeasurements(*input.Measurements)
	}

	return nil
}

func (p *Performer) CopyFromUpdateInput(input PerformerUpdateInput) error {
	CopyFull(p, input)

	if input.Birthdate != nil {
		p.setBirthdate(*input.Birthdate)
	}

	if input.Measurements != nil {
		p.setMeasurements(*input.Measurements)
	}

	return nil
}

func CreatePerformerImages(performerID uuid.UUID, imageIds []uuid.UUID) PerformersImages {
	var imageJoins PerformersImages
	for _, iid := range imageIds {
		imageJoin := &PerformerImage{
			PerformerID: performerID,
			ImageID:     iid,
		}
		imageJoins = append(imageJoins, imageJoin)
	}

	return imageJoins
}

func (p *Performer) CopyFromPerformerEdit(input PerformerEdit, old PerformerEdit) {
	fe := fromEdit{}
	fe.string(&p.Name, input.Name)
	fe.nullString(&p.Disambiguation, input.Disambiguation, old.Disambiguation)
	fe.nullString(&p.Gender, input.Gender, old.Gender)
	fe.nullString(&p.Ethnicity, input.Ethnicity, old.Ethnicity)
	fe.nullString(&p.Country, input.Country, old.Country)
	fe.nullString(&p.EyeColor, input.EyeColor, old.EyeColor)
	fe.nullString(&p.HairColor, input.HairColor, old.HairColor)
	fe.nullInt64(&p.Height, input.Height, old.Height)
	fe.nullString(&p.BreastType, input.BreastType, old.BreastType)
	fe.nullInt64(&p.CareerStartYear, input.CareerStartYear, old.CareerStartYear)
	fe.nullInt64(&p.CareerEndYear, input.CareerEndYear, old.CareerEndYear)
	fe.nullString(&p.CupSize, input.CupSize, old.CupSize)
	fe.nullInt64(&p.BandSize, input.BandSize, old.BandSize)
	fe.nullInt64(&p.HipSize, input.HipSize, old.HipSize)
	fe.nullInt64(&p.WaistSize, input.WaistSize, old.WaistSize)
	fe.sqliteDate(&p.Birthdate, input.Birthdate, old.Birthdate)
	fe.nullString(&p.BirthdateAccuracy, input.BirthdateAccuracy, old.BirthdateAccuracy)

	p.UpdatedAt = SQLiteTimestamp{Timestamp: time.Now()}
}

func (p *Performer) ValidateModifyEdit(edit PerformerEditData) error {
	v := editValidator{}

	v.string("name", edit.Old.Name, p.Name)
	v.string("disambiguation", edit.Old.Disambiguation, p.Disambiguation.String)
	v.string("gender", edit.Old.Gender, p.Gender.String)
	v.string("ethnicity", edit.Old.Ethnicity, p.Ethnicity.String)
	v.string("country", edit.Old.Country, p.Country.String)
	v.string("eye color", edit.Old.EyeColor, p.EyeColor.String)
	v.string("hair color", edit.Old.HairColor, p.HairColor.String)
	v.int64("height", edit.Old.Height, p.Height.Int64)
	v.string("breast type", edit.Old.BreastType, p.BreastType.String)
	v.int64("career start year", edit.Old.CareerStartYear, p.CareerStartYear.Int64)
	v.int64("career end year", edit.Old.CareerEndYear, p.CareerEndYear.Int64)
	v.string("cup size", edit.Old.CupSize, p.CupSize.String)
	v.int64("band size", edit.Old.BandSize, p.BandSize.Int64)
	v.int64("hip size", edit.Old.HipSize, p.HipSize.Int64)
	v.int64("waist size", edit.Old.WaistSize, p.WaistSize.Int64)
	v.string("birthdate", edit.Old.Birthdate, p.Birthdate.String)
	v.string("birthdate accuracy", edit.Old.BirthdateAccuracy, p.BirthdateAccuracy.String)

	return v.err
}

type PerformerQuery struct {
	Filter PerformerQueryInput
}
