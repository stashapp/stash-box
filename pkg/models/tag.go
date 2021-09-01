package models

import "github.com/gofrs/uuid"

type TagRepo interface {
	Create(newTag Tag) (*Tag, error)
	Update(updatedTag Tag) (*Tag, error)
	UpdatePartial(updatedTag Tag) (*Tag, error)
	Destroy(id uuid.UUID) error
	CreateAliases(newJoins TagAliases) error
	UpdateAliases(tagID uuid.UUID, updatedJoins TagAliases) error
	Find(id uuid.UUID) (*Tag, error)
	FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error)
	FindByIds(ids []uuid.UUID) ([]*Tag, []error)
	FindByNames(names []string) ([]*Tag, error)
	FindByName(name string) (*Tag, error)
	Count() (int, error)
	Query(tagFilter *TagFilterType, findFilter *QuerySpec) ([]*Tag, int, error)
	GetAliases(id uuid.UUID) ([]string, error)
	ApplyEdit(edit Edit, operation OperationEnum, tag *Tag) (*Tag, error)
}
