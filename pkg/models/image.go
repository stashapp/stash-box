package models

import (
	"github.com/gofrs/uuid"
)

type ImageRepo interface {
	ImageCreator
	ImageDestroyer
	ImageFinder

	FindByIds(ids []uuid.UUID) ([]*Image, []error)
	FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error)
	FindIdsByPerformerIds(ids []uuid.UUID) ([][]uuid.UUID, []error)
	FindBySceneID(sceneID uuid.UUID) ([]*Image, error)
	FindByPerformerID(performerID uuid.UUID) (Images, error)
	FindByStudioID(studioID uuid.UUID) ([]*Image, error)
	FindIdsByStudioIds(ids []uuid.UUID) ([][]uuid.UUID, []error)
}

type ImageCreator interface {
	Create(newImage Image) (*Image, error)
}

type ImageFinder interface {
	Find(id uuid.UUID) (*Image, error)
	FindByChecksum(checksum string) (*Image, error)
	FindByPerformerID(performerID uuid.UUID) (Images, error)
	FindUnused() ([]*Image, error)
	IsUnused(imageID uuid.UUID) (bool, error)
}

type ImageDestroyer interface {
	Destroy(id uuid.UUID) error
}
