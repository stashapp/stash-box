package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/utils"
)

type ImageRepo interface {
	ImageCreator
	ImageUpdater
	ImageDestroyer
	ImageFinder
}

type ImageCreator interface {
	Create(newImage Image) (*Image, error)
}

type ImageUpdater interface {
	Update(updatedImage Image) (*Image, error)
}

type ImageFinder interface {
	Find(id uuid.UUID) (*Image, error)
	FindByChecksum(checksum string) (*Image, error)
	FindUnused() ([]*Image, error)
	IsUnused(imageID uuid.UUID) (bool, error)
}

type ImageDestroyer interface {
	Destroy(id uuid.UUID) error
}

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

func (qb *ImageQueryBuilder) FindByChecksum(checksum string) (*Image, error) {
	query := `
		SELECT images.* FROM images
		WHERE images.checksum = ?
	`
	args := []interface{}{checksum}
	ret, err := qb.queryImages(query, args)
	if err != nil {
		return nil, err
	}

	if len(ret) > 0 {
		return ret[0], nil
	}

	return nil, nil
}

func (qb *ImageQueryBuilder) FindUnused() ([]*Image, error) {
	query := `
		SELECT images.* from images
		LEFT JOIN scene_images ON scene_images.image_id = images.id
		LEFT JOIN performer_images ON performer_images.image_id = images.id
		LEFT JOIN studio_images ON studio_images.image_id = images.id
		WHERE 
		scene_images.scene_id IS NULL AND 
		performer_images.performer_id IS NULL AND
		studio_images IS NULL LIMIT 1000
	`
	args := []interface{}{}

	return qb.queryImages(query, args)
}

func (qb *ImageQueryBuilder) IsUnused(imageID uuid.UUID) (bool, error) {
	query := database.NewQueryBuilder(imageDBTable)
	query.Body = `
		SELECT images.id from images
		LEFT JOIN scene_images ON scene_images.image_id = images.id
		LEFT JOIN performer_images ON performer_images.image_id = images.id
		LEFT JOIN studio_images ON studio_images.image_id = images.id`

	query.AddWhere("images.id = ?")
	query.AddArg(imageID)

	query.AddWhere("scene_images.scene_id IS NULL")
	query.AddWhere("performer_images.performer_id IS NULL")
	query.AddWhere("studio_images.studio_id IS NULL")

	count, err := qb.dbi.Count(*query)
	if err != nil {
		return false, err
	}

	return count == 1, nil
}

func (qb *ImageQueryBuilder) FindByIds(ids []uuid.UUID) ([]*Image, []error) {

	query := `
		SELECT images.* FROM images
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	images, err := qb.queryImages(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*Image)
	for _, image := range images {
		m[image.ID] = image
	}

	result := make([]*Image, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *ImageQueryBuilder) FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := ScenesImages{}
	err := qb.dbi.FindAllJoins(sceneImageTable, ids, &images)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, image := range images {
		m[image.SceneID] = append(m[image.SceneID], image.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *ImageQueryBuilder) FindIdsByPerformerIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := PerformersImages{}
	err := qb.dbi.FindAllJoins(performerImageTable, ids, &images)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, image := range images {
		m[image.PerformerID] = append(m[image.PerformerID], image.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
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
		WHERE studios_join.studio_id = ?
	`
	args := []interface{}{studioID}
	return qb.queryImages(query, args)
}

func (qb *ImageQueryBuilder) FindIdsByStudioIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := StudiosImages{}
	err := qb.dbi.FindAllJoins(studioImageTable, ids, &images)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID][]uuid.UUID)
	for _, image := range images {
		m[image.StudioID] = append(m[image.StudioID], image.ImageID)
	}

	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *ImageQueryBuilder) queryImages(query string, args []interface{}) (Images, error) {
	output := Images{}
	err := qb.dbi.RawQuery(imageDBTable, query, args, &output)
	return output, err
}
