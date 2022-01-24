package models

import "github.com/gofrs/uuid"

type StudioRepo interface {
	Create(newStudio Studio) (*Studio, error)
	Update(updatedStudio Studio) (*Studio, error)
	Destroy(id uuid.UUID) error
	CreateURLs(newJoins StudioURLs) error
	UpdateURLs(studioID uuid.UUID, updatedJoins StudioURLs) error
	Find(id uuid.UUID) (*Studio, error)
	FindWithRedirect(id uuid.UUID) (*Studio, error)
	FindByName(name string) (*Studio, error)
	FindByParentID(id uuid.UUID) (Studios, error)
	Count() (int, error)
	Query(studioFilter *StudioFilterType, findFilter *QuerySpec, userID uuid.UUID) (Studios, int, error)
	GetURLs(id uuid.UUID) ([]*URL, error)
	GetAllURLs(ids []uuid.UUID) ([][]*URL, []error)
	CountByPerformer(performerID uuid.UUID) ([]*PerformerStudio, error)
	ApplyEdit(edit Edit, operation OperationEnum, studio *Studio) (*Studio, error)
}
