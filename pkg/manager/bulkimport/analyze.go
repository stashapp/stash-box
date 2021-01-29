package bulkimport

import (
	"encoding/csv"
	"io"

	"github.com/araddon/dateparse"
	"github.com/stashapp/stashdb/pkg/models"
)

func Analyze(input models.BulkImportInput) (*models.BulkAnalyzeResult, error) {

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

	return parseData(rows, &input)
}

func ApplyImport(data *models.BulkAnalyzeResult) (*models.BulkImportResult, error) {
	return &models.BulkImportResult{}, nil
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

func parseData(rows []map[string]string, input *models.BulkImportInput) (*models.BulkAnalyzeResult, error) {
	var errors []string
	var results []*models.SceneImportResult

	parser := Parser{
		PQB:        models.NewPerformerQueryBuilder(nil),
		TQB:        models.NewTagQueryBuilder(nil),
		SQB:        models.NewStudioQueryBuilder(nil),
		Performers: map[string]*models.PerformerImportResult{},
		Tags:       map[string]*models.TagImportResult{},
		Studios:    map[string]*models.StudioImportResult{},
	}

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

	return &models.BulkAnalyzeResult{
		Results: results,
		Errors:  errors,
	}, nil
}
