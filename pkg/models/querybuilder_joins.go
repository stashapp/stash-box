package models

import (
	"github.com/jmoiron/sqlx"

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

func (qb *JoinsQueryBuilder) UpdatePerformersScenes(sceneID int64, updatedJoins PerformersScenes) error {
	return qb.dbi.ReplaceJoins(scenePerformerTable, sceneID, &updatedJoins)
}

func (qb *JoinsQueryBuilder) DestroyPerformersScenes(sceneID int64) error {
	return qb.dbi.DeleteJoins(scenePerformerTable, sceneID)
}

func (qb *JoinsQueryBuilder) CreateScenesTags(newJoins ScenesTags) error {
	return qb.dbi.InsertJoins(sceneTagTable, &newJoins)
}

func (qb *JoinsQueryBuilder) UpdateScenesTags(sceneID int64, updatedJoins ScenesTags) error {
	return qb.dbi.ReplaceJoins(sceneTagTable, sceneID, &updatedJoins)
}

func (qb *JoinsQueryBuilder) DestroyScenesTags(sceneID int64) error {
	return qb.dbi.DeleteJoins(sceneTagTable, sceneID)
}
