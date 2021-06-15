package models

import "github.com/gofrs/uuid"

type StudioRepo interface {
	Create(newStudio Studio) (*Studio, error)
	Update(updatedStudio Studio) (*Studio, error)
	Destroy(id uuid.UUID) error
	CreateURLs(newJoins StudioURLs) error
	UpdateURLs(studioID uuid.UUID, updatedJoins StudioURLs) error
	Find(id uuid.UUID) (*Studio, error)
	FindBySceneID(sceneID int) (Studios, error)
	FindByNames(names []string) (Studios, error)
	FindByName(name string) (*Studio, error)
	FindByParentID(id uuid.UUID) (Studios, error)
	Count() (int, error)
	Query(studioFilter *StudioFilterType, findFilter *QuerySpec) (Studios, int)
	GetURLs(id uuid.UUID) (StudioURLs, error)
	GetAllURLs(ids []uuid.UUID) ([][]*URL, []error)
	CountByPerformer(performerID uuid.UUID) ([]*PerformerStudio, error)
}
