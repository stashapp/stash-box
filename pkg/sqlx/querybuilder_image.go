package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	imageTable = "images"
)

var (
	imageDBTable = newTable(imageTable, func() interface{} {
		return &models.Image{}
	})
)

type imageQueryBuilder struct {
	dbi *dbi
}

func newImageQueryBuilder(txn *txnState) models.ImageRepo {
	return &imageQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *imageQueryBuilder) toModel(ro interface{}) *models.Image {
	if ro != nil {
		return ro.(*models.Image)
	}

	return nil
}

func (qb *imageQueryBuilder) Create(newImage models.Image) (*models.Image, error) {
	ret, err := qb.dbi.Insert(imageDBTable, newImage)
	return qb.toModel(ret), err
}

func (qb *imageQueryBuilder) Update(updatedImage models.Image) (*models.Image, error) {
	ret, err := qb.dbi.Update(imageDBTable, updatedImage, false)
	return qb.toModel(ret), err
}

func (qb *imageQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, imageDBTable)
}

func (qb *imageQueryBuilder) Find(id uuid.UUID) (*models.Image, error) {
	ret, err := qb.dbi.Find(id, imageDBTable)
	return qb.toModel(ret), err
}

func (qb *imageQueryBuilder) FindBySceneID(sceneID uuid.UUID) ([]*models.Image, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN scene_images as scenes_join on scenes_join.image_id = images.id
		LEFT JOIN scenes on scenes_join.scene_id = scenes.id
		WHERE scenes.id = ?
	`
	args := []interface{}{sceneID}
	return qb.queryImages(query, args)
}

func (qb *imageQueryBuilder) FindByChecksum(checksum string) (*models.Image, error) {
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

func (qb *imageQueryBuilder) FindUnused() ([]*models.Image, error) {
	query := `
		SELECT images.* from images
		LEFT JOIN scene_images ON scene_images.image_id = images.id
		LEFT JOIN performer_images ON performer_images.image_id = images.id
		LEFT JOIN studio_images ON studio_images.image_id = images.id
		LEFT JOIN (
			SELECT (jsonb_array_elements(data#>'{new_data,added_images}')->>0)::uuid AS image_id
			FROM edits
			WHERE status = 'PENDING'
		) edit_images ON edit_images.image_id = images.id
		LEFT JOIN (
			SELECT id, (data->>'image')::uuid AS image_id
			FROM drafts
		) drafts ON images.id = drafts.image_id
		WHERE scene_images.scene_id IS NULL
		AND performer_images.performer_id IS NULL
		AND studio_images IS NULL
		AND edit_images IS NULL
		AND drafts.id IS NULL
		LIMIT 1000
	`
	args := []interface{}{}

	return qb.queryImages(query, args)
}

func (qb *imageQueryBuilder) IsUnused(imageID uuid.UUID) (bool, error) {
	query := newQueryBuilder(imageDBTable)
	query.Body = `
		SELECT images.id from images
		LEFT JOIN scene_images ON scene_images.image_id = images.id
		LEFT JOIN performer_images ON performer_images.image_id = images.id
		LEFT JOIN studio_images ON studio_images.image_id = images.id
		LEFT JOIN (
			SELECT (jsonb_array_elements(data#>'{new_data,added_images}')->>0)::uuid AS image_id
			FROM edits
			WHERE status = 'PENDING'
		) edit_images ON edit_images.image_id = images.id
		LEFT JOIN (
			SELECT id, (data->>'image')::uuid AS image_id
			FROM drafts
		) drafts ON images.id = drafts.image_id
		WHERE images.id = ?
		AND scene_images.scene_id IS NULL
		AND performer_images.performer_id IS NULL
		AND studio_images.studio_id IS NULL
		AND edit_images.image_id IS NULL
		AND drafts.id IS NULL
	`
	query.AddArg(imageID)

	count, err := qb.dbi.Count(*query)
	if err != nil {
		return false, err
	}

	return count == 1, nil
}

func (qb *imageQueryBuilder) FindByIds(ids []uuid.UUID) ([]*models.Image, []error) {

	query := `
		SELECT images.* FROM images
		WHERE id IN (?)
	`
	query, args, _ := sqlx.In(query, ids)
	images, err := qb.queryImages(query, args)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	m := make(map[uuid.UUID]*models.Image)
	for _, image := range images {
		m[image.ID] = image
	}

	result := make([]*models.Image, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}
	return result, nil
}

func (qb *imageQueryBuilder) FindIdsBySceneIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := models.ScenesImages{}
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

func (qb *imageQueryBuilder) FindIdsByPerformerIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := models.PerformersImages{}
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

func (qb *imageQueryBuilder) FindByPerformerID(performerID uuid.UUID) (models.Images, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN performer_images as performers_join on performers_join.image_id = images.id
		LEFT JOIN performers on performers_join.performer_id = performers.id
		WHERE performers.id = ?
	`
	args := []interface{}{performerID}
	return qb.queryImages(query, args)
}

func (qb *imageQueryBuilder) FindByStudioID(studioID uuid.UUID) ([]*models.Image, error) {
	query := `
		SELECT images.* FROM images
		LEFT JOIN studio_images as studios_join on studios_join.image_id = images.id
		WHERE studios_join.studio_id = ?
	`
	args := []interface{}{studioID}
	return qb.queryImages(query, args)
}

func (qb *imageQueryBuilder) FindIdsByStudioIds(ids []uuid.UUID) ([][]uuid.UUID, []error) {
	images := models.StudiosImages{}
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

func (qb *imageQueryBuilder) queryImages(query string, args []interface{}) (models.Images, error) {
	output := models.Images{}
	err := qb.dbi.RawQuery(imageDBTable, query, args, &output)
	return output, err
}
