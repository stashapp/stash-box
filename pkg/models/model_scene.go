package models

import (
	"database/sql"
	"time"

	"github.com/gofrs/uuid"
)

type Scene struct {
	ID           uuid.UUID      `db:"id" json:"id"`
	Title        sql.NullString `db:"title" json:"title"`
	Details      sql.NullString `db:"details" json:"details"`
	Date         SQLDate        `db:"date" json:"date"`
	DateAccuracy sql.NullString `db:"date_accuracy" json:"date_accuracy"`
	StudioID     uuid.NullUUID  `db:"studio_id,omitempty" json:"studio_id"`
	CreatedAt    time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt    time.Time      `db:"updated_at" json:"updated_at"`
	Duration     sql.NullInt64  `db:"duration" json:"duration"`
	Director     sql.NullString `db:"director" json:"director"`
	Code         sql.NullString `db:"code" json:"code"`
	Deleted      bool           `db:"deleted" json:"deleted"`
}

func (p Scene) GetID() uuid.UUID {
	return p.ID
}

type Scenes []*Scene

func (p Scenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Scenes) Add(o interface{}) {
	*p = append(*p, o.(*Scene))
}

type SceneURL struct {
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	SiteID  uuid.UUID `db:"site_id" json:"site_id"`
	URL     string    `db:"url" json:"url"`
}

func (u SceneURL) ID() string {
	return u.URL
}

func (u *SceneURL) ToURL() URL {
	url := URL{
		URL:    u.URL,
		SiteID: u.SiteID,
	}
	return url
}

type SceneURLs []*SceneURL

func (u SceneURLs) Each(fn func(interface{})) {
	for _, v := range u {
		fn(*v)
	}
}

func (u SceneURLs) EachPtr(fn func(interface{})) {
	for _, v := range u {
		fn(v)
	}
}

func (u *SceneURLs) Add(o interface{}) {
	*u = append(*u, o.(*SceneURL))
}

func (u *SceneURLs) Remove(id string) {
	for i, v := range *u {
		if v.ID() == id {
			(*u)[i] = (*u)[len(*u)-1]
			*u = (*u)[:len(*u)-1]
			break
		}
	}
}

func CreateSceneURLs(sceneID uuid.UUID, urls []*URL) SceneURLs {
	var ret SceneURLs

	for _, urlInput := range urls {
		ret = append(ret, &SceneURL{
			SceneID: sceneID,
			URL:     urlInput.URL,
			SiteID:  urlInput.SiteID,
		})
	}

	return ret
}

type SceneFingerprint struct {
	SceneID   uuid.UUID `db:"scene_id" json:"scene_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	Hash      string    `db:"hash" json:"hash"`
	Algorithm string    `db:"algorithm" json:"algorithm"`
	Duration  int       `db:"duration" json:"duration"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	// unused fields
	Submissions int       `db:"submissions" json:"submissions"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type SceneFingerprints []*SceneFingerprint

func (f SceneFingerprints) Each(fn func(interface{})) {
	for _, v := range f {
		fn(*v)
	}
}

func (f SceneFingerprints) EachPtr(fn func(interface{})) {
	for _, v := range f {
		fn(v)
	}
}

func (f *SceneFingerprints) Add(o interface{}) {
	*f = append(*f, o.(*SceneFingerprint))
}

func CreateSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintEditInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			for _, userID := range fingerprint.UserIds {
				ret = append(ret, &SceneFingerprint{
					SceneID:   sceneID,
					UserID:    userID,
					Hash:      fingerprint.Hash,
					Algorithm: fingerprint.Algorithm.String(),
					Duration:  fingerprint.Duration,
					CreatedAt: fingerprint.Created,
				})
			}
		}
	}

	return ret
}

func CreateSubmittedSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			for _, userID := range fingerprint.UserIds {
				ret = append(ret, &SceneFingerprint{
					SceneID:   sceneID,
					UserID:    userID,
					Hash:      fingerprint.Hash,
					Algorithm: fingerprint.Algorithm.String(),
					Duration:  fingerprint.Duration,
				})
			}
		}
	}

	return ret
}

func CreateSceneTags(sceneID uuid.UUID, tagIds []uuid.UUID) ScenesTags {
	var tagJoins ScenesTags
	for _, tagID := range tagIds {
		tagJoin := &SceneTag{
			SceneID: sceneID,
			TagID:   tagID,
		}
		tagJoins = append(tagJoins, tagJoin)
	}

	return tagJoins
}

func CreateSceneImages(sceneID uuid.UUID, imageIds []uuid.UUID) ScenesImages {
	var imageJoins ScenesImages
	for _, imageID := range imageIds {
		imageJoin := &SceneImage{
			SceneID: sceneID,
			ImageID: imageID,
		}
		imageJoins = append(imageJoins, imageJoin)
	}

	return imageJoins
}

func CreateScenePerformers(sceneID uuid.UUID, appearances []*PerformerAppearanceInput) PerformersScenes {
	var performerJoins PerformersScenes
	for _, a := range appearances {
		performerJoin := &PerformerScene{
			SceneID:     sceneID,
			PerformerID: a.PerformerID,
		}

		if a.As != nil {
			performerJoin.As = sql.NullString{Valid: true, String: *a.As}
		}

		performerJoins = append(performerJoins, performerJoin)
	}

	return performerJoins
}

func (p *Scene) IsEditTarget() {
}

func (p *Scene) setDate(fuzzyDate FuzzyDateInput) {
	p.Date = SQLDate{String: fuzzyDate.Date, Valid: fuzzyDate.Date != ""}
	p.DateAccuracy = sql.NullString{String: fuzzyDate.Accuracy.String(), Valid: fuzzyDate.Date != ""}
}

func (p Scene) ResolveDate() *FuzzyDate {
	if !p.Date.Valid {
		return nil
	}

	ret := FuzzyDate{Date: p.Date.String}

	if p.DateAccuracy.Valid {
		ret.Accuracy = DateAccuracyEnum(p.DateAccuracy.String)
		if !ret.Accuracy.IsValid() {
			ret.Accuracy = ""
		}
	}

	return &ret
}

func (p *Scene) CopyFromCreateInput(input SceneCreateInput) error {
	CopyFull(p, input)

	date, accuracy, err := ParseFuzzyString(&input.Date)
	if err != nil {
		return err
	}
	p.Date = date
	p.DateAccuracy = accuracy

	return nil
}

func (p *Scene) CopyFromUpdateInput(input SceneUpdateInput) error {
	CopyFull(p, input)

	date, accuracy, err := ParseFuzzyString(input.Date)
	if err != nil {
		return err
	}
	p.Date = date
	p.DateAccuracy = accuracy

	return nil
}

func (p *Scene) CopyFromSceneEdit(input SceneEdit, old *SceneEdit) {
	fe := fromEdit{}
	fe.nullString(&p.Title, input.Title, old.Title)
	fe.nullString(&p.Details, input.Details, old.Details)
	fe.sqlDate(&p.Date, input.Date, old.Date)
	fe.nullString(&p.DateAccuracy, input.DateAccuracy, old.DateAccuracy)
	fe.nullUUID(&p.StudioID, input.StudioID, old.StudioID)
	fe.nullInt64(&p.Duration, input.Duration, old.Duration)
	fe.nullString(&p.Director, input.Director, old.Director)
	fe.nullString(&p.Code, input.Code, old.Code)
}

func (p *Scene) ValidateModifyEdit(edit SceneEditData) error {
	v := editValidator{}

	v.string("Title", edit.Old.Title, p.Title.String)
	v.string("Details", edit.Old.Details, p.Details.String)
	v.string("Date", edit.Old.Date, p.Date.String)
	v.string("Date Accuracy", edit.Old.DateAccuracy, p.DateAccuracy.String)
	v.uuid("StudioID", edit.Old.StudioID, p.StudioID)
	v.int64("Duration", edit.Old.Duration, p.Duration.Int64)
	v.string("Director", edit.Old.Director, p.Director.String)
	v.string("Code", edit.Old.Code, p.Code.String)

	return v.err
}

type SceneQuery struct {
	Filter SceneQueryInput
}
