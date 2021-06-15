package models

import "github.com/gofrs/uuid"

type JoinsRepo interface {
	CreatePerformersScenes(newJoins PerformersScenes) error
	UpdatePerformersScenes(sceneID uuid.UUID, updatedJoins PerformersScenes) error
	DestroyPerformersScenes(sceneID uuid.UUID) error
	CreateScenesTags(newJoins ScenesTags) error
	UpdateScenesTags(sceneID uuid.UUID, updatedJoins ScenesTags) error
	DestroyScenesTags(sceneID uuid.UUID) error
	CreateScenesImages(newJoins ScenesImages) error
	UpdateScenesImages(sceneID uuid.UUID, updatedJoins ScenesImages) error
	DestroyScenesImages(sceneID uuid.UUID) error
	CreatePerformersImages(newJoins PerformersImages) error
	UpdatePerformersImages(performerID uuid.UUID, updatedJoins PerformersImages) error
	DestroyPerformersImages(performerID uuid.UUID) error
	CreateStudiosImages(newJoins StudiosImages) error
	UpdateStudiosImages(studioID uuid.UUID, updatedJoins StudiosImages) error
	DestroyStudiosImages(studioID uuid.UUID) error
}
