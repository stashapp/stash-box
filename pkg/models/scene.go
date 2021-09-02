package models

import "github.com/gofrs/uuid"

type SceneRepo interface {
	Create(newScene Scene) (*Scene, error)
	Update(updatedScene Scene) (*Scene, error)
	Destroy(id uuid.UUID) error
	SoftDelete(scene Scene) (*Scene, error)
	CreateURLs(newJoins SceneURLs) error
	UpdateURLs(scene uuid.UUID, updatedJoins SceneURLs) error
	CreateFingerprints(newJoins SceneFingerprints) error
	UpdateFingerprints(sceneID uuid.UUID, updatedJoins SceneFingerprints) error
	Find(id uuid.UUID) (*Scene, error)
	FindByFingerprint(algorithm FingerprintAlgorithm, hash string) ([]*Scene, error)
	FindByFingerprints(fingerprints []string) ([]*Scene, error)
	FindByFullFingerprints(fingerprints []*FingerprintQueryInput) ([]*Scene, error)
	FindByTitle(name string) ([]*Scene, error)
	Count() (int, error)
	Query(sceneFilter *SceneFilterType, findFilter *QuerySpec) ([]*Scene, int)
	GetFingerprints(id uuid.UUID) (SceneFingerprints, error)
	GetAllFingerprints(ids []uuid.UUID) ([][]*Fingerprint, []error)
	GetPerformers(id uuid.UUID) (PerformersScenes, error)
	GetAllAppearances(ids []uuid.UUID) ([]PerformersScenes, []error)
	GetURLs(id uuid.UUID) ([]*URL, error)
	GetAllURLs(ids []uuid.UUID) ([][]*URL, []error)
	SearchScenes(term string, limit int) ([]*Scene, error)
	CountByPerformer(id uuid.UUID) (int, error)
	MergeInto(source *Scene, target *Scene) error
	ApplyModifyEdit(scene *Scene, data *SceneEditData) (*Scene, error)
}
