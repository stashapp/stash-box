package bulkimport

import (
	"github.com/stashapp/stash-box/pkg/models"
)

func GetSceneImportMappings(repo models.Repo, user *models.User) (*models.SceneImportMappings, error) {
	m := newMapper(repo)

	if err := processImportSceneData(repo.ImportRow(), user, func(s *models.SceneImportResult) error {
		return m.parseRow(s)
	}); err != nil {
		return nil, err
	}

	return m.createImportMappings(), nil
}

type mapper struct {
	pqb        models.PerformerRepo
	tqb        models.TagRepo
	sqb        models.StudioRepo
	performers map[string]*models.PerformerImportMapping
	tags       map[string]*models.TagImportMapping
	studios    map[string]*models.StudioImportMapping
}

func newMapper(repo models.Repo) *mapper {
	return &mapper{
		pqb:        repo.Performer(),
		tqb:        repo.Tag(),
		sqb:        repo.Studio(),
		performers: make(map[string]*models.PerformerImportMapping),
		tags:       make(map[string]*models.TagImportMapping),
		studios:    make(map[string]*models.StudioImportMapping),
	}
}

func (m *mapper) parseRow(r *models.SceneImportResult) error {
	for _, p := range r.Performers {
		if err := m.mapPerformer(p); err != nil {
			return err
		}
	}

	for _, t := range r.Tags {
		if err := m.mapTag(t); err != nil {
			return err
		}
	}

	if r.Studio != nil {
		if err := m.mapStudio(*r.Studio); err != nil {
			return err
		}
	}

	return nil
}

func (m *mapper) createImportMappings() *models.SceneImportMappings {
	ret := &models.SceneImportMappings{}

	for _, v := range m.performers {
		if v != nil {
			ret.Performers = append(ret.Performers, v)
		}
	}

	for _, v := range m.tags {
		if v != nil {
			ret.Tags = append(ret.Tags, v)
		}
	}

	for _, v := range m.studios {
		if v != nil {
			ret.Studios = append(ret.Studios, v)
		}
	}

	return ret
}

func (m *mapper) mapPerformer(value string) error {
	_, found := m.performers[value]
	if found {
		return nil
	}

	existingPerformers, err := m.pqb.FindByName(value)
	if err != nil {
		return err
	}

	// use the first viable performer
	var performer *models.Performer
	for i := 0; performer == nil && i < len(existingPerformers); i++ {
		performer = existingPerformers[i]

		if performer.Deleted {
			redirectPerformer, err := m.pqb.FindByRedirect(performer.ID)
			if err != nil {
				return err
			}

			performer = nil
			if redirectPerformer != nil {
				performer = redirectPerformer
			}
		}
	}

	var result *models.PerformerImportMapping
	if performer != nil {
		result = &models.PerformerImportMapping{
			Name:              value,
			ExistingPerformer: performer,
		}
	}

	m.performers[value] = result
	return nil
}

func (m *mapper) mapTag(value string) error {
	_, found := m.tags[value]
	if found {
		return nil
	}

	existingTag, err := m.tqb.FindByName(value)
	if err != nil {
		return err
	}

	// use the first viable tag
	if existingTag != nil {
		if existingTag.Deleted {
			alias, err := m.tqb.FindByAlias(existingTag.Name)
			if err != nil {
				return err
			}

			existingTag = nil
			if alias != nil {
				existingTag = alias
			}
		}
	}

	var result *models.TagImportMapping
	if existingTag != nil {
		result = &models.TagImportMapping{
			Name:        value,
			ExistingTag: existingTag,
		}
	}

	m.tags[value] = result
	return nil
}

func (m *mapper) mapStudio(value string) error {
	_, found := m.tags[value]
	if found {
		return nil
	}

	existingStudio, err := m.sqb.FindByName(value)
	if err != nil {
		return err
	}

	// use the first viable studio
	if existingStudio != nil {
		if existingStudio.Deleted {
			existingStudio = nil
		}
	}

	var result *models.StudioImportMapping
	if existingStudio != nil {
		result = &models.StudioImportMapping{
			Name:           value,
			ExistingStudio: existingStudio,
		}
	}

	m.studios[value] = result
	return nil
}
