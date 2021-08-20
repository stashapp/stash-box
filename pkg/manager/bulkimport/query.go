package bulkimport

import (
	"math"
	"strconv"

	"github.com/stashapp/stash-box/pkg/models"
)

func QueryImportSceneData(rw models.ImportRowRepo, user *models.User, querySpec *models.QuerySpec) (*models.QueryImportScenesResult, error) {
	rows, count := rw.QueryForUser(user.ID, querySpec)

	ret := &models.QueryImportScenesResult{
		Count: count,
	}

	for _, r := range rows {
		data := r.GetData()
		row := models.SceneImportResult{
			Title:       getDataString(data, models.ImportSceneColumnTypeTitle),
			Date:        getDataString(data, models.ImportSceneColumnTypeDate),
			Description: getDataString(data, models.ImportSceneColumnTypeDescription),
			Image:       getDataString(data, models.ImportSceneColumnTypeImage),
			URL:         getDataString(data, models.ImportSceneColumnTypeURL),
			Duration:    getDataInt(data, models.ImportSceneColumnTypeDuration),
			Studio:      getDataString(data, models.ImportSceneColumnTypeStudio),
			Performers:  getDataList(data, models.ImportSceneColumnTypePerformers),
			Tags:        getDataList(data, models.ImportSceneColumnTypeTags),
		}

		ret.Scenes = append(ret.Scenes, &row)
	}

	return ret, nil
}

func getDataString(data models.ImportRowData, field models.ImportSceneColumnType) *string {
	v := data[field.String()]
	if v == nil {
		return nil
	}

	vStr, isStr := v.(string)

	if !isStr || vStr == "" {
		return nil
	}

	return &vStr
}

func getDataInt(data models.ImportRowData, field models.ImportSceneColumnType) *int {
	v := data[field.String()]
	if v == nil {
		return nil
	}

	vInt, isInt := v.(int)
	if isInt {
		return &vInt
	}

	vStr, isStr := v.(string)

	if !isStr || vStr == "" {
		return nil
	}

	vInt, err := strconv.Atoi(vStr)
	if err != nil {
		return nil
	}

	return &vInt
}

func getDataList(data models.ImportRowData, field models.ImportSceneColumnType) []string {
	v := data[field.String()]
	if v == nil {
		return nil
	}

	// possible to be a single string
	strVal, isStr := v.(string)
	if isStr {
		return []string{strVal}
	}

	// expect a []interface{}
	slice, isSlice := v.([]interface{})
	if !isSlice {
		return nil
	}

	var ret []string
	for _, vv := range slice {
		vvStr, isStr := vv.(string)
		if !isStr {
			// shoudn't happen - just ignore
		} else if vvStr != "" {
			ret = append(ret, vvStr)
		}
	}

	return ret
}

func processImportSceneData(rw models.ImportRowRepo, user *models.User, fn func(s *models.SceneImportResult) error) error {
	// determine total
	page := 1
	pp := 0
	querySpec := &models.QuerySpec{
		Page:    &page,
		PerPage: &pp,
	}
	_, count := rw.QueryForUser(user.ID, querySpec)

	const batchSize = 1000

	totalPages := int(math.Ceil(float64(count) / float64(batchSize)))
	pp = batchSize

	for page = 1; page <= totalPages; page++ {
		r, err := QueryImportSceneData(rw, user, querySpec)
		if err != nil {
			return err
		}

		for _, s := range r.Scenes {
			if err := fn(s); err != nil {
				return err
			}
		}
	}

	return nil
}
