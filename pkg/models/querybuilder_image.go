package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/database"
)

type ImageQueryBuilder struct {
	dbi database.DBI
}

func NewImageQueryBuilder(tx *sqlx.Tx) ImageQueryBuilder {
	return ImageQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *ImageQueryBuilder) toModel(ro interface{}) *Image {
	if ro != nil {
		return ro.(*Image)
	}

	return nil
}

func (qb *ImageQueryBuilder) Create(newImage Image) (*Image, error) {
	ret, err := qb.dbi.Insert(newImage)
	return qb.toModel(ret), err
}

func (qb *ImageQueryBuilder) Update(updatedImage Image) (*Image, error) {
	ret, err := qb.dbi.Update(updatedImage, false)
	return qb.toModel(ret), err
}

func (qb *ImageQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, imageDBTable)
}

func (qb *ImageQueryBuilder) Find(id uuid.UUID) (*Image, error) {
	ret, err := qb.dbi.Find(id, imageDBTable)
	return qb.toModel(ret), err
}

func (qb *ImageQueryBuilder) FindBySceneID(sceneID uuid.UUID) ([]*Image, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN scene_images as scenes_join on scenes_join.image_id = images.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
	`
	args := []interface{}{sceneID}
	return qb.queryImages(query, args)
}

func (qb *ImageQueryBuilder) FindByPerformerID(performerID uuid.UUID) ([]*Image, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN performer_images as performers_join on performers_join.image_id = images.id
		LEFT JOIN performers on performers_join.performer_id = performers.id
		WHERE performers.id = ?
	`
	args := []interface{}{performerID}
	return qb.queryImages(query, args)
}

func (qb *ImageQueryBuilder) FindByStudioID(studioID uuid.UUID) ([]*Image, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN studio_images as studios_join on studios_join.image_id = images.id
		LEFT JOIN studios on studios_join.studio_id = studios.id
		WHERE studios.id = ?
	`
	args := []interface{}{studioID}
	return qb.queryImages(query, args)
}

func (qb *ImageQueryBuilder) queryImages(query string, args []interface{}) (Images, error) {
	output := Images{}
	err := qb.dbi.RawQuery(imageDBTable, query, args, &output)
	return output, err
}
