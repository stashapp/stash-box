package models

import (
	"database/sql"
	"fmt"
	"github.com/gofrs/uuid"
	"time"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	performerTable   = "performers"
	performerJoinKey = "performer_id"
)

var (
	performerDBTable = database.NewTable(performerTable, func() interface{} {
		return &Performer{}
	})

	performerAliasTable = database.NewTableJoin(performerTable, "performer_aliases", performerJoinKey, func() interface{} {
		return &PerformerAlias{}
	})

	performerUrlTable = database.NewTableJoin(performerTable, "performer_urls", performerJoinKey, func() interface{} {
		return &PerformerUrl{}
	})

	performerTattooTable = database.NewTableJoin(performerTable, "performer_tattoos", performerJoinKey, func() interface{} {
		return &PerformerBodyMod{}
	})

	performerPiercingTable = database.NewTableJoin(performerTable, "performer_piercings", performerJoinKey, func() interface{} {
		return &PerformerBodyMod{}
	})

	performerRedirectTable = database.NewTableJoin(tagTable, "performer_redirects", "source_id", func() interface{} {
		return &PerformerRedirect{}
	})
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

func (Performer) GetTable() database.Table {
	return performerDBTable
}

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

type PerformerRedirect struct {
	SourceID uuid.UUID `db:"source_id" json:"source_id"`
	TargetID uuid.UUID `db:"target_id" json:"target_id"`
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
		if (*v).ID() == id {
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

func CreatePerformerAliases(performerId uuid.UUID, aliases []string) PerformerAliases {
	var ret PerformerAliases

	for _, alias := range aliases {
		ret = append(ret, &PerformerAlias{PerformerID: performerId, Alias: alias})
	}

	return ret
}

type PerformerUrl struct {
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
	URL         string    `db:"url" json:"url"`
	Type        string    `db:"type" json:"type"`
}

func (p *PerformerUrl) ToURL() URL {
	url := URL{
		URL:  p.URL,
		Type: p.Type,
	}
	return url
}

func (p *PerformerUrl) ID() string {
	return p.URL + p.Type
}

type PerformerUrls []*PerformerUrl

func (p PerformerUrls) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p PerformerUrls) EachPtr(fn func(interface{})) {
	for _, v := range p {
		fn(v)
	}
}

func (p *PerformerUrls) Add(o interface{}) {
	*p = append(*p, o.(*PerformerUrl))
}

func (p *PerformerUrls) Remove(id string) {
	for i, v := range *p {
		if (*v).ID() == id {
			(*p)[i] = (*p)[len(*p)-1]
			*p = (*p)[:len(*p)-1]
			break
		}
	}
}

func CreatePerformerUrls(performerId uuid.UUID, urls []*URL) PerformerUrls {
	var ret PerformerUrls

	for _, urlInput := range urls {
		ret = append(ret, &PerformerUrl{
			PerformerID: performerId,
			URL:         urlInput.URL,
			Type:        urlInput.Type,
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
		if (*v).ID() == id {
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

func CreatePerformerBodyMods(performerId uuid.UUID, urls []*BodyModification) PerformerBodyMods {
	var ret PerformerBodyMods

	for _, bmInput := range urls {
		description := sql.NullString{}

		if bmInput.Description != nil {
			description.String = *bmInput.Description
			description.Valid = true
		}
		ret = append(ret, &PerformerBodyMod{
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

func CreatePerformerImages(performerID uuid.UUID, imageIds []string) PerformersImages {
	var imageJoins PerformersImages
	for _, iid := range imageIds {
		imageID := uuid.FromStringOrNil(iid)
		imageJoin := &PerformerImage{
			PerformerID: performerID,
			ImageID:     imageID,
		}
		imageJoins = append(imageJoins, imageJoin)
	}

	return imageJoins
}

func (p *Performer) CopyFromPerformerEdit(input PerformerEdit) {
	if input.Name != nil {
		p.Name = *input.Name
	}
	if input.Disambiguation != nil {
		p.Disambiguation = sql.NullString{String: *input.Disambiguation, Valid: true}
	}
	if input.Gender != nil {
		p.Gender = sql.NullString{String: *input.Gender, Valid: true}
	}
	if input.Ethnicity != nil {
		p.Ethnicity = sql.NullString{String: *input.Ethnicity, Valid: true}
	}
	if input.Country != nil {
		p.Country = sql.NullString{String: *input.Country, Valid: true}
	}
	if input.EyeColor != nil {
		p.EyeColor = sql.NullString{String: *input.EyeColor, Valid: true}
	}
	if input.HairColor != nil {
		p.HairColor = sql.NullString{String: *input.HairColor, Valid: true}
	}
	if input.Height != nil {
		p.Height = sql.NullInt64{Int64: *input.Height, Valid: true}
	}
	if input.BreastType != nil {
		p.BreastType = sql.NullString{String: *input.BreastType, Valid: true}
	}
	if input.CareerStartYear != nil {
		p.CareerStartYear = sql.NullInt64{Int64: *input.CareerStartYear, Valid: true}
	}
	if input.CareerEndYear != nil {
		p.CareerEndYear = sql.NullInt64{Int64: *input.CareerEndYear, Valid: true}
	}
	if input.CupSize != nil {
		p.CupSize = sql.NullString{String: *input.CupSize, Valid: *input.CupSize != ""}
	}
	if input.BandSize != nil {
		p.BandSize = sql.NullInt64{Int64: *input.BandSize, Valid: *input.BandSize != 0}
	}
	if input.HipSize != nil {
		p.HipSize = sql.NullInt64{Int64: *input.HipSize, Valid: *input.HipSize != 0}
	}
	if input.WaistSize != nil {
		p.WaistSize = sql.NullInt64{Int64: *input.WaistSize, Valid: *input.WaistSize != 0}
	}

	if input.Birthdate != nil {
		p.Birthdate = SQLiteDate{String: *input.Birthdate, Valid: *input.Birthdate != ""}

		if input.BirthdateAccuracy != nil {
			p.BirthdateAccuracy = sql.NullString{String: *input.BirthdateAccuracy, Valid: *input.BirthdateAccuracy != ""}
		}
	}

	p.UpdatedAt = SQLiteTimestamp{Timestamp: time.Now()}
}

func (p *Performer) ValidateModifyEdit(edit PerformerEditData) error {
	if edit.Old.Name != nil && *edit.Old.Name != p.Name {
		return fmt.Errorf("Invalid name. Expected '%v' but was '%v'", *edit.Old.Name, p.Name)
	}
	if edit.Old.Disambiguation != nil && *edit.Old.Disambiguation != p.Disambiguation.String {
		return fmt.Errorf("Invalid disambiguation. Expected '%v' but was '%v'", *edit.Old.Disambiguation, p.Disambiguation.String)
	}
	if edit.Old.Gender != nil && *edit.Old.Gender != p.Gender.String {
		return fmt.Errorf("Invalid gender. Expected '%v' but was '%v'", *edit.Old.Gender, p.Gender.String)
	}
	if edit.Old.Ethnicity != nil && *edit.Old.Ethnicity != p.Ethnicity.String {
		return fmt.Errorf("Invalid ethnicity. Expected '%v' but was '%v'", *edit.Old.Ethnicity, p.Ethnicity.String)
	}
	if edit.Old.Country != nil && *edit.Old.Country != p.Country.String {
		return fmt.Errorf("Invalid country. Expected '%v' but was '%v'", *edit.Old.Country, p.Country.String)
	}
	if edit.Old.EyeColor != nil && *edit.Old.EyeColor != p.EyeColor.String {
		return fmt.Errorf("Invalid eye color. Expected '%v' but was '%v'", *edit.Old.EyeColor, p.EyeColor.String)
	}
	if edit.Old.HairColor != nil && *edit.Old.HairColor != p.HairColor.String {
		return fmt.Errorf("Invalid hair color. Expected '%v' but was '%v'", *edit.Old.HairColor, p.HairColor.String)
	}
	if edit.Old.Height != nil && *edit.Old.Height != p.Height.Int64 {
		return fmt.Errorf("Invalid height. Expected %d but was %d", *edit.Old.Height, p.Height.Int64)
	}
	if edit.Old.BreastType != nil && *edit.Old.BreastType != p.BreastType.String {
		return fmt.Errorf("Invalid breast type. Expected '%v' but was '%v'", *edit.Old.BreastType, p.BreastType.String)
	}
	if edit.Old.CareerStartYear != nil && *edit.Old.CareerStartYear != p.CareerStartYear.Int64 {
		return fmt.Errorf("Invalid career start year. Expected %d but was %d", *edit.Old.CareerStartYear, p.CareerStartYear.Int64)
	}
	if edit.Old.CareerEndYear != nil && *edit.Old.CareerEndYear != p.CareerEndYear.Int64 {
		return fmt.Errorf("Invalid career end year. Expected %d but was %d", *edit.Old.CareerEndYear, p.CareerEndYear.Int64)
	}
	if edit.Old.CupSize != nil && *edit.Old.CupSize != p.CupSize.String {
		return fmt.Errorf("Invalid cup size. Expected '%v' but was '%v'", *edit.Old.CupSize, p.CupSize.String)
	}
	if edit.Old.BandSize != nil && *edit.Old.BandSize != p.BandSize.Int64 {
		return fmt.Errorf("Invalid band size. Expected %d but was %d", *edit.Old.BandSize, p.BandSize.Int64)
	}
	if edit.Old.HipSize != nil && *edit.Old.HipSize != p.HipSize.Int64 {
		return fmt.Errorf("Invalid hip size. Expected %d but was %d", *edit.Old.HipSize, p.HipSize.Int64)
	}
	if edit.Old.WaistSize != nil && *edit.Old.WaistSize != p.WaistSize.Int64 {
		return fmt.Errorf("Invalid waist size. Expected %d but was %d", *edit.Old.WaistSize, p.WaistSize.Int64)
	}
	if edit.Old.Birthdate != nil && *edit.Old.Birthdate != p.Birthdate.String {
		return fmt.Errorf("Invalid birthdate. Expected '%v' but was '%v'", *edit.Old.Birthdate, p.Birthdate.String)
	}
	if edit.Old.BirthdateAccuracy != nil && *edit.Old.BirthdateAccuracy != p.BirthdateAccuracy.String {
		return fmt.Errorf("Invalid birthdate accuracy. Expected '%v' but was '%v'", *edit.Old.BirthdateAccuracy, p.BirthdateAccuracy.String)
	}

	return nil
}
