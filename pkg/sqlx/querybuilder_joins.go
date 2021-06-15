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
