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
	DestroyFingerprints(sceneID uuid.UUID, toDelete SceneFingerprints) error
	Find(id uuid.UUID) (*Scene, error)
	FindByIds(ids []uuid.UUID) ([]*Scene, error)
	FindByFingerprint(algorithm FingerprintAlgorithm, hash string) ([]*Scene, error)
	FindByFingerprints(fingerprints []string) ([]*Scene, error)
	FindByFullFingerprints(fingerprints []*FingerprintQueryInput) ([]*Scene, error)
	FindIdsBySceneFingerprints(fingerprints []*FingerprintQueryInput) (map[string][]uuid.UUID, error)
	FindExistingScenes(input QueryExistingSceneInput) ([]*Scene, error)
	Count() (int, error)
	QueryScenes(filter SceneQueryInput, userID uuid.UUID) ([]*Scene, error)
	QueryCount(filter SceneQueryInput, userID uuid.UUID) (int, error)
	GetFingerprints(id uuid.UUID) (SceneFingerprints, error)

	// GetAllFingerprints returns fingerprints for each of the scene ids provided.
	// currentUserID is used to populate the UserSubmitted field.
	GetAllFingerprints(currentUserID uuid.UUID, ids []uuid.UUID, onlySubmitted bool) ([][]*Fingerprint, []error)
	GetPerformers(id uuid.UUID) (PerformersScenes, error)
	GetAllAppearances(ids []uuid.UUID) ([]PerformersScenes, []error)
	GetURLs(id uuid.UUID) ([]*URL, error)
	GetAllURLs(ids []uuid.UUID) ([][]*URL, []error)
	SearchScenes(term string, limit int) ([]*Scene, error)
	CountByPerformer(id uuid.UUID) (int, error)
	MergeInto(source *Scene, target *Scene) error
	ApplyEdit(scene *Scene, create bool, data *SceneEditData, userID *uuid.UUID) (*Scene, error)
	GetEditTags(id *uuid.UUID, data *SceneEdit) ([]uuid.UUID, error)
	GetEditImages(id *uuid.UUID, data *SceneEdit) ([]uuid.UUID, error)
	GetEditURLs(id *uuid.UUID, data *SceneEdit) ([]*URL, error)
	GetEditPerformers(id *uuid.UUID, obj *SceneEdit) ([]*PerformerAppearanceInput, error)
}
