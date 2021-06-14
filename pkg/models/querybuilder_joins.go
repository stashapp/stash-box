package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/database"
)

type joinsQueryBuilder struct {
	dbi database.DBI
}

func NewJoinsQueryBuilder(tx *sqlx.Tx) JoinsRepo {
	return &joinsQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *joinsQueryBuilder) CreatePerformersScenes(newJoins PerformersScenes) error {
	return qb.dbi.InsertJoins(scenePerformerTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdatePerformersScenes(sceneID uuid.UUID, updatedJoins PerformersScenes) error {
	return qb.dbi.ReplaceJoins(scenePerformerTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyPerformersScenes(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(scenePerformerTable, sceneID)
}

func (qb *joinsQueryBuilder) CreateScenesTags(newJoins ScenesTags) error {
	return qb.dbi.InsertJoins(sceneTagTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateScenesTags(sceneID uuid.UUID, updatedJoins ScenesTags) error {
	return qb.dbi.ReplaceJoins(sceneTagTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyScenesTags(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneTagTable, sceneID)
}

func (qb *joinsQueryBuilder) CreateScenesImages(newJoins ScenesImages) error {
	return qb.dbi.InsertJoins(sceneImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateScenesImages(sceneID uuid.UUID, updatedJoins ScenesImages) error {
	return qb.dbi.ReplaceJoins(sceneImageTable, sceneID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyScenesImages(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneImageTable, sceneID)
}

func (qb *joinsQueryBuilder) CreatePerformersImages(newJoins PerformersImages) error {
	return qb.dbi.InsertJoins(performerImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdatePerformersImages(performerID uuid.UUID, updatedJoins PerformersImages) error {
	return qb.dbi.ReplaceJoins(performerImageTable, performerID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyPerformersImages(performerID uuid.UUID) error {
	return qb.dbi.DeleteJoins(performerImageTable, performerID)
}

func (qb *joinsQueryBuilder) CreateStudiosImages(newJoins StudiosImages) error {
	return qb.dbi.InsertJoins(studioImageTable, &newJoins)
}

func (qb *joinsQueryBuilder) UpdateStudiosImages(studioID uuid.UUID, updatedJoins StudiosImages) error {
	return qb.dbi.ReplaceJoins(studioImageTable, studioID, &updatedJoins)
}

func (qb *joinsQueryBuilder) DestroyStudiosImages(studioID uuid.UUID) error {
	return qb.dbi.DeleteJoins(studioImageTable, studioID)
}
