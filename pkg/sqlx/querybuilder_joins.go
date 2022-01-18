package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

var (
	scenePerformerTable = newTableJoin(sceneTable, "scene_performers", sceneJoinKey, func() interface{} {
		return &models.PerformerScene{}
	})

	performerSceneTable = newTableJoin(sceneTable, "scene_performers", performerJoinKey, func() interface{} {
		return &models.PerformerScene{}
	})

	sceneTagTable = newTableJoin(sceneTable, "scene_tags", sceneJoinKey, func() interface{} {
		return &models.SceneTag{}
	})

	tagSceneTable = newTableJoin(tagTable, "scene_tags", tagJoinKey, func() interface{} {
		return &models.SceneTag{}
	})

	sceneImageTable = newTableJoin(sceneTable, "scene_images", sceneJoinKey, func() interface{} {
		return &models.SceneImage{}
	})

	performerImageTable = newTableJoin(performerTable, "performer_images", performerJoinKey, func() interface{} {
		return &models.PerformerImage{}
	})

	studioImageTable = newTableJoin(studioTable, "studio_images", studioJoinKey, func() interface{} {
		return &models.StudioImage{}
	})

	studioFavoriteTable = newTableJoin(studioTable, "studio_favorites", studioJoinKey, func() interface{} {
		return &models.StudioFavorite{}
	})

	performerFavoriteTable = newTableJoin(performerTable, "performer_favorites", performerJoinKey, func() interface{} {
		return &models.PerformerFavorite{}
	})
)

type joinsQueryBuilder struct {
	dbi *dbi
}

func newJoinsQueryBuilder(txn *txnState) models.JoinsRepo {
	return &joinsQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *joinsQueryBuilder) CreatePerformersScenes(newJoins models.PerformersScenes) error {
	return qb.dbi.InsertJoins(scenePerformerTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdatePerformersScenes(sceneID uuid.UUID, updatedJoins models.PerformersScenes) error {
	return qb.dbi.ReplaceJoins(scenePerformerTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyPerformersScenes(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(scenePerformerTable, sceneID)
}

func (qb *joinsQueryBuilder) CreateScenesTags(newJoins models.ScenesTags) error {
	return qb.dbi.InsertJoins(sceneTagTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateScenesTags(sceneID uuid.UUID, updatedJoins models.ScenesTags) error {
	return qb.dbi.ReplaceJoins(sceneTagTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyScenesTags(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneTagTable, sceneID)
}

func (qb *joinsQueryBuilder) CreateScenesImages(newJoins models.ScenesImages) error {
	return qb.dbi.InsertJoins(sceneImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateScenesImages(sceneID uuid.UUID, updatedJoins models.ScenesImages) error {
	return qb.dbi.ReplaceJoins(sceneImageTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyScenesImages(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneImageTable, sceneID)
}

func (qb *joinsQueryBuilder) CreatePerformersImages(newJoins models.PerformersImages) error {
	return qb.dbi.InsertJoins(performerImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdatePerformersImages(performerID uuid.UUID, updatedJoins models.PerformersImages) error {
	return qb.dbi.ReplaceJoins(performerImageTable, performerID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyPerformersImages(performerID uuid.UUID) error {
	return qb.dbi.DeleteJoins(performerImageTable, performerID)
}

func (qb *joinsQueryBuilder) CreateStudiosImages(newJoins models.StudiosImages) error {
	return qb.dbi.InsertJoins(studioImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateStudiosImages(studioID uuid.UUID, updatedJoins models.StudiosImages) error {
	return qb.dbi.ReplaceJoins(studioImageTable, studioID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyStudiosImages(studioID uuid.UUID) error {
	return qb.dbi.DeleteJoins(studioImageTable, studioID)
}

func (qb *joinsQueryBuilder) AddStudioFavorite(join models.StudioFavorite) error {
	conflictHandling := "ON CONFLICT DO NOTHING"
	return qb.dbi.InsertJoin(studioFavoriteTable, join, &conflictHandling)
}

func (qb *joinsQueryBuilder) AddPerformerFavorite(join models.PerformerFavorite) error {
	conflictHandling := "ON CONFLICT DO NOTHING"
	return qb.dbi.InsertJoin(performerFavoriteTable, join, &conflictHandling)
}

func (qb *joinsQueryBuilder) DestroyStudioFavorite(join models.StudioFavorite) error {
	query := "DELETE FROM " + studioFavoriteTable.name + " WHERE studio_id = $1 AND user_id = $2"
	args := []interface{}{join.StudioID, join.UserID}
	return qb.dbi.RawExec(query, args)
}

func (qb *joinsQueryBuilder) DestroyPerformerFavorite(join models.PerformerFavorite) error {
	query := "DELETE FROM " + performerFavoriteTable.name + " WHERE performer_id = $1 AND user_id = $2"
	args := []interface{}{join.PerformerID, join.UserID}
	return qb.dbi.RawExec(query, args)
}

func (qb *joinsQueryBuilder) IsPerformerFavorite(favorite models.PerformerFavorite) (bool, error) {
	query := `
		SELECT COUNT(*) FROM ` + performerFavoriteTable.name + `
		WHERE performer_id = $1
		AND user_id = $2
	`
	args := []interface{}{favorite.PerformerID, favorite.UserID}
	res, err := runCountQuery(qb.dbi.db(), query, args)
	return res > 0, err
}

func (qb *joinsQueryBuilder) IsStudioFavorite(favorite models.StudioFavorite) (bool, error) {
	query := `
		SELECT COUNT(*) FROM ` + studioFavoriteTable.name + `
		WHERE studio_id = $1
		AND user_id = $2
	`
	args := []interface{}{favorite.StudioID, favorite.UserID}
	res, err := runCountQuery(qb.dbi.db(), query, args)
	return res > 0, err
}
