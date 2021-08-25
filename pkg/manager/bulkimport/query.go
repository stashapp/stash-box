package bulkimport

import (
	"math"
	"strconv"
	"time"

	"github.com/araddon/dateparse"
	"github.com/stashapp/stash-box/pkg/models"
)

func QueryImportSceneData(rw models.ImportRowRepo, user *models.User, querySpec *models.QuerySpec) (*models.QueryImportScenesResult, error) {
	rows, count := rw.QueryForUser(user.ID, querySpec)

	ret := &models.QueryImportScenesResult{
		Count: count,
	}

	for _, r := range rows {
		row := rowToSceneData(r)
		ret.Scenes = append(ret.Scenes, &row)
	}

	return ret, nil
}

func rowToSceneData(r *models.ImportRow) models.SceneImportResult {
	data := r.GetData()
	return models.SceneImportResult{
		Title:       getDataString(data, models.ImportSceneColumnTypeTitle),
		Date:        getDateString(data, models.ImportSceneColumnTypeDate),
		Description: getDataString(data, models.ImportSceneColumnTypeDescription),
		Image:       getDataString(data, models.ImportSceneColumnTypeImage),
		URL:         getDataString(data, models.ImportSceneColumnTypeURL),
		Duration:    parseDuration(data, models.ImportSceneColumnTypeDuration),
		Studio:      getDataString(data, models.ImportSceneColumnTypeStudio),
		Performers:  getDataList(data, models.ImportSceneColumnTypePerformers),
		Tags:        getDataList(data, models.ImportSceneColumnTypeTags),
	}
}

// expects seconds or hh:mm:ss - returns seconds
func parseDuration(data models.ImportRowData, field models.ImportSceneColumnType) *int {
	v := data[field.String()]
	if v == nil {
		return nil
	}

	switch vv := v.(type) {
	case int:
		return &vv
	case string:
		layout := "15:04:05"
		// truncate layout to same length input string
		if len(vv) < len(layout) {
			layout = layout[len(layout)-len(vv):]
		}

		c, err := time.Parse(layout, vv)
		if err != nil {
			// see if we can fallback to seconds
			sInt, err := strconv.Atoi(vv)
			if err != nil {
				return nil
			}

			return &sInt
		}

		h, m, s := c.Clock()
		d := time.Duration(h)*time.Hour +
			time.Duration(m)*time.Minute +
			time.Duration(s)*time.Second
		sInt := int(d.Seconds())
		return &sInt
	}

	return nil
}

func getDateString(data models.ImportRowData, field models.ImportSceneColumnType) *string {
	v := data[field.String()]
	if v == nil {
		return nil
	}

	vStr, isStr := v.(string)

	if !isStr || vStr == "" {
		return nil
	}

	parsedDate, err := dateparse.ParseAny(vStr)
	if err == nil {
		isoDate := parsedDate.Format("2006-01-02")
		vStr = isoDate
	}

	return &vStr
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

func processImportData(rw models.ImportRowRepo, user *models.User, fn func(r *models.ImportRow) error) error {
	// determine total
	count := getRowDataCount(rw, user)

	const batchSize = 1000
	page := 1
	pp := batchSize
	querySpec := &models.QuerySpec{
		Page:    &page,
		PerPage: &pp,
	}

	totalPages := int(math.Ceil(float64(count) / float64(batchSize)))

	for page = 1; page <= totalPages; page++ {
		rows, _ := rw.QueryForUser(user.ID, querySpec)

		for _, r := range rows {
			if err := fn(r); err != nil {
				return err
			}
		}
	}

	return nil
}

func getRowDataCount(rw models.ImportRowRepo, user *models.User) int {
	// determine total
	page := 1
	pp := 0
	querySpec := &models.QuerySpec{
		Page:    &page,
		PerPage: &pp,
	}
	_, count := rw.QueryForUser(user.ID, querySpec)

	return count
}

func processImportSceneData(rw models.ImportRowRepo, user *models.User, fn func(s *models.SceneImportResult) error) error {
	return processImportData(rw, user, func(r *models.ImportRow) error {
		sd := rowToSceneData(r)
		return fn(&sd)
	})
}
