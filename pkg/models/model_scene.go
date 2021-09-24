package models

import (
	"database/sql"
	"strconv"

	"github.com/gofrs/uuid"
)

type Scene struct {
	ID    uuid.UUID      `db:"id" json:"id"`
	Title sql.NullString `db:"title" json:"title"`

	Details   sql.NullString  `db:"details" json:"details"`
	Date      SQLiteDate      `db:"date" json:"date"`
	StudioID  uuid.NullUUID   `db:"studio_id,omitempty" json:"studio_id"`
	CreatedAt SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt SQLiteTimestamp `db:"updated_at" json:"updated_at"`
	Duration  sql.NullInt64   `db:"duration" json:"duration"`
	Director  sql.NullString  `db:"director" json:"director"`
	Deleted   bool            `db:"deleted" json:"deleted"`
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
	URL     string    `db:"url" json:"url"`
	Type    string    `db:"type" json:"type"`
}

func (u SceneURL) ID() string {
	return u.URL + u.Type
}

func (u *SceneURL) ToURL() URL {
	url := URL{
		URL:  u.URL,
		Type: u.Type,
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
		if (*v).ID() == id {
			(*u)[i] = (*u)[len(*u)-1]
			*u = (*u)[:len(*u)-1]
			break
		}
	}
}

func CreateSceneURLs(sceneID uuid.UUID, urls []*URLInput) SceneURLs {
	var ret SceneURLs

	for _, urlInput := range urls {
		ret = append(ret, &SceneURL{
			SceneID: sceneID,
			URL:     urlInput.URL,
			Type:    urlInput.Type,
		})
	}

	return ret
}

type SceneFingerprint struct {
	SceneID     uuid.UUID       `db:"scene_id" json:"scene_id"`
	Hash        string          `db:"hash" json:"hash"`
	Algorithm   string          `db:"algorithm" json:"algorithm"`
	Duration    int             `db:"duration" json:"duration"`
	Submissions int             `db:"submissions" json:"submissions"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

func (p SceneFingerprint) ID() string {
	return p.Algorithm + p.Hash + ":" + strconv.Itoa(p.Duration) + ":" + strconv.Itoa(p.Submissions)
}

func (p SceneFingerprint) ToFingerprint() *Fingerprint {
	return &Fingerprint{
		Algorithm:   FingerprintAlgorithm(p.Algorithm),
		Hash:        p.Hash,
		Duration:    p.Duration,
		Submissions: p.Submissions,
		Created:     p.CreatedAt.Timestamp,
		Updated:     p.UpdatedAt.Timestamp,
	}
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

func (f *SceneFingerprints) Remove(id string) {
	for i, v := range *f {
		if (*v).ID() == id {
			(*f)[i] = (*f)[len(*f)-1]
			*f = (*f)[:len(*f)-1]
			break
		}
	}
}

func (f SceneFingerprints) ToFingerprints() []*Fingerprint {
	var ret []*Fingerprint
	for _, v := range f {
		ret = append(ret, v.ToFingerprint())
	}

	return ret
}

func CreateSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintEditInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			ret = append(ret, &SceneFingerprint{
				SceneID:     sceneID,
				Hash:        fingerprint.Hash,
				Algorithm:   fingerprint.Algorithm.String(),
				Duration:    fingerprint.Duration,
				Submissions: fingerprint.Submissions,
				CreatedAt:   SQLiteTimestamp{Timestamp: fingerprint.Created},
				UpdatedAt:   SQLiteTimestamp{Timestamp: fingerprint.Updated},
			})
		}
	}

	return ret
}

func CreateSubmittedSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			ret = append(ret, &SceneFingerprint{
				SceneID:   sceneID,
				Hash:      fingerprint.Hash,
				Algorithm: fingerprint.Algorithm.String(),
				Duration:  fingerprint.Duration,
			})
		}
	}

	return ret
}

func CreateSceneTags(sceneID uuid.UUID, tagIds []string) ScenesTags {
	var tagJoins ScenesTags
	for _, tid := range tagIds {
		tagID := uuid.FromStringOrNil(tid)
		tagJoin := &SceneTag{
			SceneID: sceneID,
			TagID:   tagID,
		}
		tagJoins = append(tagJoins, tagJoin)
	}

	return tagJoins
}

func CreateSceneImages(sceneID uuid.UUID, imageIds []string) ScenesImages {
	var imageJoins ScenesImages
	for _, iid := range imageIds {
		imageID := uuid.FromStringOrNil(iid)
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
		performerID, _ := uuid.FromString(a.PerformerID)
		performerJoin := &PerformerScene{
			SceneID:     sceneID,
			PerformerID: performerID,
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

func (p *Scene) setDate(date string) {
	p.Date = SQLiteDate{String: date, Valid: true}
}

func (p *Scene) CopyFromCreateInput(input SceneCreateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}

func (p *Scene) CopyFromUpdateInput(input SceneUpdateInput) {
	CopyFull(p, input)

	if input.Date != nil {
		p.setDate(*input.Date)
	}
}

func (p *Scene) CopyFromSceneEdit(input SceneEdit, old *SceneEdit) {
	fe := fromEdit{}
	fe.nullString(&p.Title, input.Title, old.Title)
	fe.nullString(&p.Details, input.Details, old.Details)
	fe.sqliteDate(&p.Date, input.Date, old.Date)
	fe.nullUUID(&p.StudioID, input.StudioID, old.StudioID)
	fe.nullInt64(&p.Duration, input.Duration, old.Duration)
	fe.nullString(&p.Director, input.Director, old.Director)
}

func (p *Scene) ValidateModifyEdit(edit SceneEditData) error {
	v := editValidator{}

	v.string("Title", edit.Old.Title, p.Title.String)
	v.string("Details", edit.Old.Details, p.Details.String)
	v.string("Date", edit.Old.Date, p.Date.String)
	v.uuid("StudioID", edit.Old.StudioID, p.StudioID)
	v.int64("Duration", edit.Old.Duration, p.Duration.Int64)
	v.string("Director", edit.Old.Director, p.Director.String)

	return nil
}
