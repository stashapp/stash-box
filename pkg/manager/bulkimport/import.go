package bulkimport

import (
	"database/sql"
	"errors"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/image"
	"github.com/stashapp/stash-box/pkg/models"
)

func userHasPendingImport(rw models.ImportRowRepo, user *models.User) bool {
	page := 1
	pp := 0
	_, count := rw.QueryForUser(user.ID, &models.QuerySpec{
		Page:    &page,
		PerPage: &pp,
	})

	return count > 0
}

func SubmitImport(repo models.Repo, user *models.User, input models.SubmitImportInput) error {
	// ensure user does not already have a pending import
	if userHasPendingImport(repo.ImportRow(), user) {
		return errors.New("existing import pending")
	}

	var i int
	if err := readImportData(repo, input.Type, input.Data.File, func(row map[string]string) error {
		out := models.ImportRow{
			UserID: user.ID,
			Row:    i,
		}

		outMap := make(models.ImportRowData)
		for key, val := range row {
			outMap[key] = val
		}

		if err := out.SetData(outMap); err != nil {
			return err
		}

		if _, err := repo.ImportRow().Create(out); err != nil {
			return err
		}

		return nil
	}); err != nil {
		return err
	}

	return nil
}

func PreviewMassageImportData(repo models.Repo, user *models.User, input models.MassageImportDataInput, querySpec *models.QuerySpec) (*models.ParseImportDataResult, error) {
	delimiter := ""
	if input.ListDelimiter != nil {
		delimiter = *input.ListDelimiter
	}

	importer := rowImporter{
		userID:    user.ID,
		rw:        repo.ImportRow(),
		fields:    input.Fields,
		delimiter: delimiter,
	}

	rows, count := repo.ImportRow().QueryForUser(user.ID, querySpec)

	data := [][]*models.ParseImportDataTuple{}

	for _, r := range rows {
		dt := []*models.ParseImportDataTuple{}
		rr := importer.processImportRow(r.GetData())

		for k, v := range rr {
			vSlice, isSlice := v.([]string)
			if !isSlice {
				vSlice = []string{v.(string)}
			}

			dt = append(dt, &models.ParseImportDataTuple{
				Field: k,
				Value: vSlice,
			})
		}

		data = append(data, dt)
	}

	return &models.ParseImportDataResult{
		Count: count,
		Data:  data,
	}, nil
}

func MassageImportData(repo models.Repo, user *models.User, input models.MassageImportDataInput) error {
	delimiter := ""
	if input.ListDelimiter != nil {
		delimiter = *input.ListDelimiter
	}

	rw := repo.ImportRow()

	importer := rowImporter{
		userID:    user.ID,
		rw:        rw,
		fields:    input.Fields,
		delimiter: delimiter,
	}

	return processImportData(rw, user, func(r *models.ImportRow) error {
		rr := importer.processImportRow(r.GetData())

		// overwrite existing row data
		newRow := *r
		if err := newRow.SetData(rr); err != nil {
			return err
		}

		_, err := rw.Update(newRow)

		return err
	})
}

func AbortImport(repo models.Repo, user *models.User) error {
	return repo.ImportRow().DestroyForUser(user.ID)
}

func CompleteImport(repo models.Repo, user *models.User, input models.CompleteSceneImportInput) error {
	performerMap := createMappingMap(input.Performers)
	studioMap := createMappingMap(input.Studios)
	tagMap := createMappingMap(input.Tags)

	if err := processImportSceneData(repo.ImportRow(), user, func(scene *models.SceneImportResult) error {
		// TODO - move to scene package
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

		if scene.Studio != nil {
			studioID := studioMap[*scene.Studio]

			if studioID != nil {
				newScene.StudioID = uuid.NullUUID{UUID: *studioID, Valid: true}
			}
		}

		createdScene, err := repo.Scene().Create(newScene)
		if err != nil {
			return err
		}

		scenePerformers := makePerformerJoins(scene.Performers, createdScene.ID, performerMap)
		if err := repo.Joins().CreatePerformersScenes(scenePerformers); err != nil {
			return err
		}

		if scene.URL != nil {
			sceneUrls := models.CreateSceneURLs(createdScene.ID, []*models.URL{{URL: *scene.URL, Type: "STUDIO"}})
			if err := repo.Scene().CreateURLs(sceneUrls); err != nil {
				return err
			}
		}

		sceneTags := makeTagJoins(scene.Tags, createdScene.ID, tagMap)
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

		return nil
	}); err != nil {
		return err
	}

	return repo.ImportRow().DestroyForUser(user.ID)
}

func createMappingMap(mappings []*models.ImportMappingInput) map[string]*uuid.UUID {
	ret := make(map[string]*uuid.UUID)
	for _, m := range mappings {
		if m.ID != nil {
			id, _ := uuid.FromString(*m.ID)
			ret[m.Name] = &id
		}
	}

	return ret
}

func makePerformerJoins(performers []string, sceneID uuid.UUID, performerMap map[string]*uuid.UUID) models.PerformersScenes {
	var ret models.PerformersScenes
	for _, performerID := range performers {
		id := performerMap[performerID]
		if id != nil {
			ret = append(ret, &models.PerformerScene{PerformerID: *id, SceneID: sceneID})
		}
	}

	return ret
}

func makeTagJoins(tags []string, sceneID uuid.UUID, tagMap map[string]*uuid.UUID) models.ScenesTags {
	var ret models.ScenesTags
	for _, tagID := range tags {
		id := tagMap[tagID]
		if id != nil {
			ret = append(ret, &models.SceneTag{TagID: *id, SceneID: sceneID})
		}
	}

	return ret
}

type rowImporter struct {
	userID    uuid.UUID
	rw        models.ImportRowRepo
	delimiter string
	fields    []*models.ImportFieldInput
}

func (r rowImporter) processImportRow(row models.ImportRowData) models.ImportRowData {
	outMap := make(models.ImportRowData)
	touchedFields := []string{}
	for _, field := range r.fields {
		var v interface{}
		if field.FixedValue != nil {
			v = *field.FixedValue
		} else if field.InputField != nil {
			touchedFields = append(touchedFields, *field.InputField)

			vIfc := row[*field.InputField]

			vStr, isStr := vIfc.(string)
			if !isStr {
				// leave already list-parsed fields as-is
				v = vIfc
			} else {
				vStr = processRegex(vStr, field.RegexReplacements)

				if r.delimiter != "" && strings.Contains(vStr, r.delimiter) {
					v = strings.Split(vStr, r.delimiter)
				} else {
					v = vStr
				}
			}
		}

		if v != "" {
			outMap[field.OutputField] = v
		}
	}

	return outMap
}

func processRegex(v string, replacements []*models.RegexReplacementInput) string {
	for _, r := range replacements {
		re, err := regexp.Compile(r.Regex)
		if err != nil {
			// TODO - handle regex errors - ignore for now
			continue
		}

		v = re.ReplaceAllString(v, r.ReplaceWith)
	}

	return v
}

func createImage(repo models.Repo, url string) (*models.Image, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}

	data, err := ioutil.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if err != nil {
		return nil, err
	}

	imageService := image.GetService(repo.Image())
	return imageService.Create(&url, data)
}
