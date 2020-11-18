package models

import (
	"github.com/jmoiron/sqlx"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/database"
)

type JoinsQueryBuilder struct {
	dbi database.DBI
}

func NewJoinsQueryBuilder(tx *sqlx.Tx) JoinsQueryBuilder {
	return JoinsQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *JoinsQueryBuilder) CreatePerformersScenes(newJoins PerformersScenes) error {
	return qb.dbi.InsertJoins(scenePerformerTable, &newJoins)
}

func (qb *JoinsQueryBuilder) UpdatePerformersScenes(sceneID uuid.UUID, updatedJoins PerformersScenes) error {
	return qb.dbi.ReplaceJoins(scenePerformerTable, sceneID, &updatedJoins)
}

func (qb *JoinsQueryBuilder) DestroyPerformersScenes(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(scenePerformerTable, sceneID)
}

func (qb *JoinsQueryBuilder) CreateScenesTags(newJoins ScenesTags) error {
	return qb.dbi.InsertJoins(sceneTagTable, &newJoins)
}

func (qb *JoinsQueryBuilder) UpdateScenesTags(sceneID uuid.UUID, updatedJoins ScenesTags) error {
	return qb.dbi.ReplaceJoins(sceneTagTable, sceneID, &updatedJoins)
}

func (qb *JoinsQueryBuilder) DestroyScenesTags(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneTagTable, sceneID)
}

func (qb *JoinsQueryBuilder) CreateScenesImages(newJoins ScenesImages) error {
	return qb.dbi.InsertJoins(sceneImageTable, &newJoins)
}

func (qb *JoinsQueryBuilder) UpdateScenesImages(sceneID uuid.UUID, updatedJoins ScenesImages) error {
	return qb.dbi.ReplaceJoins(sceneImageTable, sceneID, &updatedJoins)
}

func (qb *JoinsQueryBuilder) DestroyScenesImages(sceneID uuid.UUID) error {
	return qb.dbi.DeleteJoins(sceneImageTable, sceneID)
}
