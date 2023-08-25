package sqlx

import (
	"time"

	"github.com/gofrs/uuid"
)

type dbSceneFingerprint struct {
	SceneID       uuid.UUID `db:"scene_id" json:"scene_id"`
	UserID        uuid.UUID `db:"user_id" json:"user_id"`
	FingerprintID int       `db:"fingerprint_id" json:"fingerprint_id"`
	Duration      int       `db:"duration" json:"duration"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
	Vote          int       `db:"vote" json:"vote"`
}

type DBSceneFingerprints []*dbSceneFingerprint

func (f DBSceneFingerprints) Each(fn func(interface{})) {
	for _, v := range f {
		fn(*v)
	}
}

func (f DBSceneFingerprints) EachPtr(fn func(interface{})) {
	for _, v := range f {
		fn(v)
	}
}

func (f *DBSceneFingerprints) Add(o interface{}) {
	*f = append(*f, o.(*dbSceneFingerprint))
}
