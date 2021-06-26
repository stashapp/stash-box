package models

import "github.com/gofrs/uuid"

type TagRepo interface {
	Create(newTag Tag) (*Tag, error)
	Update(updatedTag Tag) (*Tag, error)
	UpdatePartial(updatedTag Tag) (*Tag, error)
	Destroy(id uuid.UUID) error
	DeleteSceneTags(id uuid.UUID) error
	SoftDelete(tag Tag) (*Tag, error)
	CreateRedirect(newJoin TagRedirect) error
	UpdateRedirects(oldTargetID uuid.UUID, newTargetID uuid.UUID) error
	UpdateSceneTags(oldTargetID uuid.UUID, newTargetID uuid.UUID) error
	CreateAliases(newJoins TagAliases) error
	UpdateAliases(tagID uuid.UUID, updatedJoins TagAliases) error
	Find(id uuid.UUID) (*Tag, error)
	FindByNameOrAlias(name string) (*Tag, error)
	FindBySceneID(sceneID uuid.UUID) ([]*Tag, error)
	FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error)
	FindByIds(ids []uuid.UUID) ([]*Tag, []error)
	FindByNames(names []string) ([]*Tag, error)
	FindByAliases(names []string) ([]*Tag, error)
	FindByName(name string) (*Tag, error)
	FindByAlias(name string) (*Tag, error)
	Count() (int, error)
	Query(tagFilter *TagFilterType, findFilter *QuerySpec) ([]*Tag, int, error)
	GetRawAliases(id uuid.UUID) (TagAliases, error)
	GetAliases(id uuid.UUID) ([]string, error)
	MergeInto(sourceID uuid.UUID, targetID uuid.UUID) error
	ApplyEdit(edit Edit, operation OperationEnum, tag *Tag) (*Tag, error)
}
