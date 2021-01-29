package bulkimport

import (
	"fmt"
	"regexp"
	"strconv"

	"github.com/stashapp/stashdb/pkg/models"
)

type Parser struct {
	PQB        models.PerformerQueryBuilder
	TQB        models.TagQueryBuilder
	SQB        models.StudioQueryBuilder
	Performers map[string]*models.PerformerImportResult
	Tags       map[string]*models.TagImportResult
	Studios    map[string]*models.StudioImportResult
}

func (p *Parser) ParsePerformers(value *string, column *models.ImportColumn) ([]*models.PerformerImportResult, *string, error) {
	performers := []*models.PerformerImportResult{}

	results, errors := runRegularExpression(value, column)
	if errors != nil {
		return nil, errors, nil
	}

	for _, name := range results {
		if cached := p.Performers[*name]; cached != nil {
			performers = append(performers, cached)
			continue
		}

		existingPerformers, err := p.PQB.FindByName(*name)
		if err != nil {
			return nil, nil, err
		}

		performer := models.PerformerImportResult{
			Name: name,
		}
		if len(existingPerformers) > 0 {
			performer.ExistingPerformer = existingPerformers[0]
		}

		p.Performers[*name] = &performer
		performers = append(performers, &performer)
	}

	return performers, nil, nil
}

func (p *Parser) ParseTags(value *string, column *models.ImportColumn) ([]*models.TagImportResult, *string, error) {
	tags := []*models.TagImportResult{}

	results, errors := runRegularExpression(value, column)
	if errors != nil {
		return nil, errors, nil
	}

	for _, name := range results {
		if cached := p.Tags[*name]; cached != nil {
			tags = append(tags, cached)
			continue
		}

		existingTags, err := p.TQB.FindByName(*name)
		if err != nil {
			return nil, nil, err
		}

		tag := models.TagImportResult{
			Name: name,
		}
		if len(existingTags) > 0 {
			tag.ExistingTag = existingTags[0]
		}

		p.Tags[*name] = &tag
		tags = append(tags, &tag)
	}

	return tags, nil, nil
}

func (p *Parser) ParseStudio(value *string, column *models.ImportColumn) (*models.StudioImportResult, *string, error) {
	results, errors := runRegularExpression(value, column)
	if errors != nil {
		return nil, errors, nil
	}

	if len(results) == 0 {
		return nil, nil, nil
	}
	name := results[0]

	if cached := p.Studios[*name]; cached != nil {
		return cached, nil, nil
	}

	existingStudio, err := p.SQB.FindByName(*name)
	if err != nil {
		return nil, nil, err
	}

	studio := models.StudioImportResult{
		Name: name,
	}
	if existingStudio != nil {
		studio.ExistingStudio = existingStudio
	}

	p.Studios[*name] = &studio

	return &studio, nil, nil
}

func (p *Parser) ParseDuration(value *string, column *models.ImportColumn) (int, error) {
	if column.RegularExpression == nil || len(*column.RegularExpression) == 0 {
		return 0, nil
	}
	re, err := regexp.Compile(*column.RegularExpression)
	if err != nil {
		return 0, err
	}

	match := re.FindStringSubmatch(*value)

	results := map[string]string{}
	for i, name := range match {
		results[re.SubexpNames()[i]] = name
	}

	var duration int64
	if seconds, ok := results["seconds"]; ok {
		dur, err := strconv.ParseInt(seconds, 10, 32)
		if err != nil {
			return 0, err
		}
		duration = dur
	}
	if minutes, ok := results["minutes"]; ok {
		dur, err := strconv.ParseInt(minutes, 10, 32)
		if err != nil {
			return 0, err
		}
		duration = duration + dur*60
	}
	if hours, ok := results["hours"]; ok {
		dur, err := strconv.ParseInt(hours, 10, 32)
		if err != nil {
			return 0, err
		}
		duration = duration + dur*3600
	}

	returnVal := int(duration)
	return returnVal, nil
}

func runRegularExpression(value *string, column *models.ImportColumn) ([]*string, *string) {
	var results []*string

	if column == nil || column.RegularExpression == nil {
		results = append(results, value)
	} else {
		re, err := regexp.Compile(*column.RegularExpression)
		if err != nil {
			error := fmt.Sprintf("Failed to compile regex for column `%s`: %s", column.Name, err.Error())
			return nil, &error
		}

		matches := re.FindAllStringSubmatch(*value, -1)
		for _, res := range matches {
			if len(res) > 1 {
				results = append(results, &res[1])
			} else {
				error := fmt.Sprintf("Missing capture group in regular expression for column `%s`", column.Name)
				return nil, &error
			}
		}
	}

	return results, nil
}
