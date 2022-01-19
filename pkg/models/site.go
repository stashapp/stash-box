package models

import "github.com/gofrs/uuid"

type SiteRepo interface {
	Create(newSite Site) (*Site, error)
	Update(updatedSite Site) (*Site, error)
	Destroy(id uuid.UUID) error
	Find(id uuid.UUID) (*Site, error)
	FindByIds(ids []uuid.UUID) ([]*Site, []error)
	Query(findFilter *QuerySpec) ([]*Site, int, error)
}
