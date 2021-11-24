package models

import "github.com/gofrs/uuid"

type TagCategoryRepo interface {
	Create(newCategory TagCategory) (*TagCategory, error)
	Update(updatedCategory TagCategory) (*TagCategory, error)
	Destroy(id uuid.UUID) error
	Find(id uuid.UUID) (*TagCategory, error)
	FindByIds(ids []uuid.UUID) ([]*TagCategory, []error)
	Query(findFilter *QuerySpec) ([]*TagCategory, int, error)
}
