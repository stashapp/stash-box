package bulkimport

import (
	"database/sql"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func ApplyImport(repo models.Repo, data *models.BulkAnalyzeResult) (*models.BulkImportResult, error) {
	performers := make(map[string]*uuid.UUID)
	tags := make(map[string]*uuid.UUID)
	studios := make(map[string]*uuid.UUID)

	err := repo.WithTxn(func() error {
		for _, scene := range data.Results {
			UUID, err := uuid.NewV4()
			if err != nil {
				return err
			}
			currentTime := time.Now()
			newScene := models.Scene{
				ID:        UUID,
				CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
				UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
			}
			if scene.Title != nil {
				newScene.Title = sql.NullString{String: *scene.Title, Valid: true}
			}
			if scene.Description != nil {
				newScene.Details = sql.NullString{String: *scene.Description, Valid: true}
			}
			if scene.Duration != nil {
				newScene.Duration = sql.NullInt64{Int64: int64(*scene.Duration), Valid: true}
			}
			if scene.Date != nil {
				newScene.Date = models.SQLiteDate{String: *scene.Date, Valid: true}
			}

			studioID, err := resolveStudio(*scene.Studio, repo, studios)
			if err != nil {
				return err
			} else if studioID != nil {
				newScene.StudioID = *studioID
			}

			createdScene, err := repo.Scene().Create(newScene)
			if err != nil {
				return err
			}

			scenePerformers, err := resolvePerformers(scene.Performers, createdScene.ID, repo, performers)
			if err := repo.Joins().CreatePerformersScenes(scenePerformers); err != nil {
				return err
			}

			if scene.URL != nil {
				sceneUrls := models.CreateSceneURLs(createdScene.ID, []*models.URL{{URL: *scene.URL, Type: "STUDIO"}})
				if err := repo.Scene().CreateURLs(sceneUrls); err != nil {
					return err
				}
			}

			sceneTags, err := resolveTags(scene.Tags, createdScene.ID, repo, tags)
			if err := repo.Joins().CreateScenesTags(sceneTags); err != nil {
				return err
			}

			if scene.Image != nil {
				image, err := createImage(repo, *scene.Image)

				// If error is encountered, skip image
				if err == nil && image != nil {
					if err := repo.Joins().CreateScenesImages(models.ScenesImages{{
						SceneID: createdScene.ID,
						ImageID: image.ID,
					}}); err != nil {
						return err
					}
				}
			}
		}
		return nil
	})

	return &models.BulkImportResult{}, err
}

func resolveStudio(studio models.StudioImportResult, repo models.Repo, studioCache map[string]*uuid.UUID) (*uuid.NullUUID, error) {
	studioName := *studio.Name
	if id, ok := studioCache[studioName]; ok && id != nil {
		return &uuid.NullUUID{UUID: *id, Valid: true}, nil
	}
	if studio.ExistingStudio != nil {
		if studio.ExistingStudio.Deleted {
			studioCache[studioName] = nil
		} else {
			studioCache[studioName] = &studio.ExistingStudio.ID
			return &uuid.NullUUID{UUID: studio.ExistingStudio.ID, Valid: true}, nil
		}
	}

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	currentTime := time.Now()
	studioInput := models.Studio{
		ID:        UUID,
		Name:      studioName,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newStudio, err := repo.Studio().Create(studioInput)
	if err != nil {
		return nil, err
	}

	studioCache[studioName] = &newStudio.ID
	return &uuid.NullUUID{UUID: newStudio.ID, Valid: true}, nil
}

func resolvePerformers(performers []*models.PerformerImportResult, sceneID uuid.UUID, repo models.Repo, performerCache map[string]*uuid.UUID) (models.PerformersScenes, error) {
	var scenePerformers []uuid.UUID
	for _, performer := range performers {
		if id, ok := performerCache[*performer.Name]; ok {
			if id != nil {
				scenePerformers = append(scenePerformers, *id)
			}
			continue
		}
		if performer.ExistingPerformer != nil {
			if performer.ExistingPerformer.Deleted {
				performerCache[*performer.Name] = nil
			} else {
				performerCache[*performer.Name] = &performer.ExistingPerformer.ID
				scenePerformers = append(scenePerformers, performer.ExistingPerformer.ID)
			}
			continue
		}

		UUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}

		currentTime := time.Now()
		performerInput := models.Performer{
			ID:        UUID,
			Name:      *performer.Name,
			CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
			UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		}

		newPerformer, err := repo.Performer().Create(performerInput)
		if err != nil {
			return nil, err
		}

		performerCache[*performer.Name] = &newPerformer.ID
		scenePerformers = append(scenePerformers, newPerformer.ID)
	}

	var performersScenes models.PerformersScenes
	for _, performer := range scenePerformers {
		performersScenes = append(performersScenes, &models.PerformerScene{PerformerID: performer, SceneID: sceneID})
	}

	return performersScenes, nil
}

func resolveTags(tags []*models.TagImportResult, sceneID uuid.UUID, repo models.Repo, tagCache map[string]*uuid.UUID) (models.ScenesTags, error) {
	var sceneTags []uuid.UUID
	for _, tag := range tags {
		if id, ok := tagCache[*tag.Name]; ok {
			if id != nil {
				sceneTags = append(sceneTags, *id)
			}
			continue
		}
		if tag.ExistingTag != nil {
			if tag.ExistingTag.Deleted {
				tagCache[*tag.Name] = nil
			} else {
				tagCache[*tag.Name] = &tag.ExistingTag.ID
				sceneTags = append(sceneTags, tag.ExistingTag.ID)
			}
			continue
		}

		UUID, err := uuid.NewV4()
		if err != nil {
			return nil, err
		}

		currentTime := time.Now()
		tagInput := models.Tag{
			ID:        UUID,
			Name:      *tag.Name,
			CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
			UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		}

		newTag, err := repo.Tag().Create(tagInput)
		if err != nil {
			return nil, err
		}

		tagCache[*tag.Name] = &newTag.ID
		sceneTags = append(sceneTags, newTag.ID)
	}

	var scenesTags models.ScenesTags
	for _, tag := range sceneTags {
		scenesTags = append(scenesTags, &models.SceneTag{TagID: tag, SceneID: sceneID})
	}

	return scenesTags, nil
}

func createImage(repo models.Repo, url string) (*models.Image, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	data, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return nil, err
	}

	imageService := image.GetService(repo.Image())
	return imageService.Create(&url, data)
}
