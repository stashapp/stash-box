package models

import "github.com/gofrs/uuid"

type EditRepo interface {
	Create(newEdit Edit) (*Edit, error)
	Update(updatedEdit Edit) (*Edit, error)
	Destroy(id uuid.UUID) error
	Find(id uuid.UUID) (*Edit, error)
	CreateEditTag(newJoin EditTag) error
	CreateEditPerformer(newJoin EditPerformer) error
	CreateEditStudio(newJoin EditStudio) error
	FindTagID(id uuid.UUID) (*uuid.UUID, error)
	FindPerformerID(id uuid.UUID) (*uuid.UUID, error)
	FindStudioID(id uuid.UUID) (*uuid.UUID, error)
	Count() (int, error)
	Query(editFilter *EditFilterType, findFilter *QuerySpec) ([]*Edit, int)
	CreateComment(newJoin EditComment) error
	GetComments(id uuid.UUID) (EditComments, error)
	FindByTagID(id uuid.UUID) ([]*Edit, error)
	FindByPerformerID(id uuid.UUID) ([]*Edit, error)
	FindByStudioID(id uuid.UUID) ([]*Edit, error)
}
