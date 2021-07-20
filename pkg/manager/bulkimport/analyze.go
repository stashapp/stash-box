package bulkimport

import (
	"encoding/csv"
	"fmt"
	"io"
	"time"

	"github.com/araddon/dateparse"
	"github.com/stashapp/stash-box/pkg/models"
)

func Analyze(repo models.Repo, input models.BulkImportInput) (*models.BulkAnalyzeResult, error) {
	rows := []map[string]string{}
	if input.Type == models.ImportDataTypeCsv {
		data, err := parseCSV(&input)
		if err != nil {
			return nil, err
		}
		rows = data
	} else {
		data, err := parseJSON(&input)
		if err != nil {
			return nil, err
		}
		rows = data
	}

	return parseData(repo, rows, &input)
}

func parseCSV(input *models.BulkImportInput) ([]map[string]string, error) {
	reader := csv.NewReader(input.Data.File)
	rows := []map[string]string{}
	var header []string

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		if header == nil {
			header = record
		} else {
			dict := map[string]string{}
			for i := range header {
				dict[header[i]] = record[i]
			}
			rows = append(rows, dict)
		}
	}

	return rows, nil
}

func parseJSON(input *models.BulkImportInput) ([]map[string]string, error) {
	return nil, nil
}

func parseData(repo models.Repo, rows []map[string]string, input *models.BulkImportInput) (*models.BulkAnalyzeResult, error) {
	var errors []string
	var results []*models.SceneImportResult

	parser := Parser{
		PQB:        repo.Performer(),
		TQB:        repo.Tag(),
		SQB:        repo.Studio(),
		Performers: map[string]*models.PerformerImportResult{},
		Tags:       map[string]*models.TagImportResult{},
		Studios:    map[string]*models.StudioImportResult{},
	}

	start := time.Now()

	mainStudioResult, studioError, err := parser.ParseStudio(&input.MainStudio, nil)
	if err != nil {
		return nil, err
	}
	if studioError != nil {
		errors = append(errors, *studioError)
	}

	for _, row := range rows {
		result := models.SceneImportResult{}
		for _, column := range input.Columns {
			value := row[column.Name]

			switch column.Type {
			case models.ImportColumnTypeTitle:
				result.Title = &value
			case models.ImportColumnTypeDate:
				parsedDate, err := dateparse.ParseAny(value)
				if err == nil {
					isoDate := parsedDate.Format("2006-01-02")
					result.Date = &isoDate
				}
			case models.ImportColumnTypeDuration:
				duration, err := parser.ParseDuration(&value, column)
				if err != nil {
					return nil, err
				}
				if duration != 0 {
					result.Duration = &duration
				}
			case models.ImportColumnTypeURL:
				result.URL = &value
			case models.ImportColumnTypeImage:
				result.Image = &value
			case models.ImportColumnTypeDescription:
				result.Description = &value
			case models.ImportColumnTypeStudio:
				studioResult, studioError, err := parser.ParseStudio(&value, column)
				if err != nil {
					return nil, err
				}
				if studioError != nil {
					errors = append(errors, *studioError)
				} else {
					result.Studio = studioResult
				}
			case models.ImportColumnTypeTags:
				tagResult, tagError, err := parser.ParseTags(&value, column)
				if err != nil {
					return nil, err
				}
				if tagError != nil {
					errors = append(errors, *tagError)
				} else {
					result.Tags = tagResult
				}
			case models.ImportColumnTypePerformers:
				performerResult, performerError, err := parser.ParsePerformers(&value, column)
				if err != nil {
					return nil, err
				}
				if performerError != nil {
					errors = append(errors, *performerError)
				} else {
					result.Performers = performerResult
				}
			}
		}
		if result.Studio == nil {
			result.Studio = mainStudioResult
		}
		results = append(results, &result)
		if len(errors) > 0 {
			break
		}
	}

	elapsed := time.Since(start)
	fmt.Println(fmt.Printf("Analyze took %s", elapsed))

	return &models.BulkAnalyzeResult{
		Results: results,
		Errors:  errors,
	}, nil
}
