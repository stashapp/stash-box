package models

import (
	"database/sql"

	"github.com/gofrs/uuid"
)

type Scene struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	Title     sql.NullString  `db:"title" json:"title"`
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

type SceneFingerprint struct {
	SceneID   uuid.UUID       `db:"scene_id" json:"scene_id"`
	UserID    uuid.UUID       `db:"user_id" json:"user_id"`
	Hash      string          `db:"hash" json:"hash"`
	Algorithm string          `db:"algorithm" json:"algorithm"`
	Duration  int             `db:"duration" json:"duration"`
	CreatedAt SQLiteTimestamp `db:"created_at" json:"created_at"`
	// unused fields
	Submissions int             `db:"submissions" json:"submissions"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type SceneURL struct {
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
	URL     string    `db:"url" json:"url"`
	Type    string    `db:"type" json:"type"`
}

func (p *SceneURL) ToURL() URL {
	url := URL{
		URL:  p.URL,
		Type: p.Type,
	}
	return url
}

type SceneURLs []*SceneURL

func (p SceneURLs) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneURLs) Add(o interface{}) {
	*p = append(*p, o.(*SceneURL))
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

type SceneFingerprints []*SceneFingerprint

func (p SceneFingerprints) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *SceneFingerprints) Add(o interface{}) {
	*p = append(*p, o.(*SceneFingerprint))
}

func CreateSceneFingerprints(sceneID uuid.UUID, fingerprints []*FingerprintEditInput) SceneFingerprints {
	var ret SceneFingerprints

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			for _, user := range fingerprint.UserIds {
				userID, _ := uuid.FromString(user)
				ret = append(ret, &SceneFingerprint{
					SceneID:   sceneID,
					UserID:    userID,
					Hash:      fingerprint.Hash,
					Algorithm: fingerprint.Algorithm.String(),
					Duration:  fingerprint.Duration,
					CreatedAt: SQLiteTimestamp{Timestamp: fingerprint.Created},
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
			for _, user := range fingerprint.UserIds {
				userID, _ := uuid.FromString(user)
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
