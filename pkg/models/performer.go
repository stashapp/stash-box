package models

import "github.com/gofrs/uuid"

type PerformerRepo interface {
	Create(newPerformer Performer) (*Performer, error)
	Update(updatedPerformer Performer) (*Performer, error)
	UpdatePartial(updatedPerformer Performer) (*Performer, error)
	Destroy(id uuid.UUID) error
	CreateAliases(newJoins PerformerAliases) error
	UpdateAliases(performerID uuid.UUID, updatedJoins PerformerAliases) error
	CreateUrls(newJoins PerformerURLs) error
	UpdateUrls(performerID uuid.UUID, updatedJoins PerformerURLs) error
	CreateTattoos(newJoins PerformerBodyMods) error
	UpdateTattoos(performerID uuid.UUID, updatedJoins PerformerBodyMods) error
	CreatePiercings(newJoins PerformerBodyMods) error
	UpdatePiercings(performerID uuid.UUID, updatedJoins PerformerBodyMods) error
	Find(id uuid.UUID) (*Performer, error)
	FindByIds(ids []uuid.UUID) ([]*Performer, []error)
	FindWithRedirect(id uuid.UUID) (*Performer, error)
	Count() (int, error)
	QueryPerformers(filter PerformerQueryInput, userID uuid.UUID) ([]*Performer, error)
	QueryCount(filter PerformerQueryInput, userID uuid.UUID) (int, error)
	GetAliases(id uuid.UUID) (PerformerAliases, error)
	GetImages(id uuid.UUID) (PerformersImages, error)
	GetAllAliases(ids []uuid.UUID) ([][]string, []error)
	GetURLs(id uuid.UUID) ([]*URL, error)
	GetAllURLs(ids []uuid.UUID) ([][]*URL, []error)
	GetTattoos(id uuid.UUID) (PerformerBodyMods, error)
	GetAllTattoos(ids []uuid.UUID) ([][]*BodyModification, []error)
	GetPiercings(id uuid.UUID) (PerformerBodyMods, error)
	GetAllPiercings(ids []uuid.UUID) ([][]*BodyModification, []error)
	SearchPerformers(term string, limit int) (Performers, error)
	ApplyEdit(performer *Performer, create bool, data *PerformerEditData) (*Performer, error)
	FindMergeIDsByPerformerIDs(ids []uuid.UUID) ([][]uuid.UUID, []error)
	SoftDelete(performer Performer) (*Performer, error)
	MergeInto(source *Performer, target *Performer, setAlias bool) error
	DeleteScenePerformers(id uuid.UUID) error
	DeletePerformerFavorites(id uuid.UUID) error
	GetEditURLs(id uuid.UUID, data *PerformerEdit) ([]*URL, error)
	GetEditImages(id uuid.UUID, data *PerformerEdit) ([]uuid.UUID, error)
	GetEditAliases(id uuid.UUID, data *PerformerEdit) ([]string, error)
	GetEditTattoos(id uuid.UUID, data *PerformerEdit) ([]*BodyModification, error)
	GetEditPiercings(id uuid.UUID, data *PerformerEdit) ([]*BodyModification, error)
}
