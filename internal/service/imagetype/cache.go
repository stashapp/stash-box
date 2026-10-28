package imagetype

import (
	"context"
	"slices"
	"sync"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

var instanceVocabularyCache = &vocabularyCache{}

type vocabulary struct {
	groups  []models.ImageTypeGroup
	ranking *Ranking
	rules   rules
}

type vocabularyCache struct {
	mu         sync.Mutex
	vocabulary *vocabulary
}

func (c *vocabularyCache) get(load func() (*vocabulary, error)) (*vocabulary, error) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.vocabulary != nil {
		return c.vocabulary, nil
	}

	vocabulary, err := load()
	if err != nil {
		return nil, err
	}

	c.vocabulary = vocabulary
	return vocabulary, nil
}

func (c *vocabularyCache) clear() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.vocabulary = nil
}

func cachedVocabulary(ctx context.Context, q *queries.Queries) (*vocabulary, error) {
	return instanceVocabularyCache.get(func() (*vocabulary, error) {
		return loadVocabulary(ctx, q)
	})
}

// InstanceRanking returns the shared instance ranking snapshot.
func (s *ImageType) InstanceRanking(ctx context.Context) (*Ranking, error) {
	vocabulary, err := cachedVocabulary(ctx, s.queries)
	if err != nil {
		return nil, err
	}
	return vocabulary.ranking, nil
}

func loadVocabulary(ctx context.Context, q *queries.Queries) (*vocabulary, error) {
	groups, err := q.GetAllImageTypeGroups(ctx)
	if err != nil {
		return nil, err
	}
	types, err := q.GetAllImageTypes(ctx)
	if err != nil {
		return nil, err
	}
	return buildVocabulary(groups, types)
}

func buildVocabulary(dbGroups []queries.ImageTypeGroup, dbTypes []queries.ImageType) (*vocabulary, error) {
	conflicts, err := loadConflictPairs(dbTypes)
	if err != nil {
		return nil, err
	}
	vocabulary := &vocabulary{
		groups: make([]models.ImageTypeGroup, 0, len(dbGroups)),
		ranking: &Ranking{
			groupPosition: make(map[string]int, len(dbGroups)),
			typePosition:  make(map[models.ImageTypeEnum]int, len(dbTypes)),
			typeGroup:     make(map[models.ImageTypeEnum]string, len(dbTypes)),
		},
		rules: rules{
			groupOf:   make(map[string]string, len(dbTypes)),
			enabled:   make(map[string]bool, len(dbTypes)),
			exclusive: make(map[string]bool, len(dbGroups)),
			conflicts: conflicts,
		},
	}

	enabledGroups := make(map[string]bool, len(dbGroups))
	for _, group := range dbGroups {
		enabledGroups[group.Key] = group.Enabled
		vocabulary.rules.exclusive[group.Key] = group.Exclusive
		if group.Enabled {
			vocabulary.ranking.groupPosition[group.Key] = vocabulary.ranking.groupCount
			vocabulary.ranking.groupCount++
		}
	}

	conflictsFor := make(map[models.ImageTypeEnum][]models.ImageTypeEnum)
	for pair := range conflicts {
		conflictsFor[pair[0]] = append(conflictsFor[pair[0]], pair[1])
		conflictsFor[pair[1]] = append(conflictsFor[pair[1]], pair[0])
	}

	typesByGroup := make(map[string][]models.ImageType, len(dbGroups))
	for _, imageType := range dbTypes {
		key := models.ImageTypeEnum(imageType.Key)
		typesByGroup[imageType.GroupKey] = append(typesByGroup[imageType.GroupKey], typeToModel(imageType, conflictsFor[key]))
		vocabulary.rules.groupOf[imageType.Key] = imageType.GroupKey
		enabled := imageType.Enabled && enabledGroups[imageType.GroupKey]
		vocabulary.rules.enabled[imageType.Key] = enabled
		if enabled {
			vocabulary.ranking.typePosition[key] = imageType.SortOrder
			vocabulary.ranking.typeGroup[key] = imageType.GroupKey
		}
	}

	for _, group := range dbGroups {
		vocabulary.groups = append(vocabulary.groups, models.ImageTypeGroup{
			Key:         models.ImageTypeGroupEnum(group.Key),
			Name:        group.Name,
			Description: group.Description,
			SortOrder:   group.SortOrder,
			Exclusive:   group.Exclusive,
			Enabled:     group.Enabled,
			Types:       typesByGroup[group.Key],
		})
	}
	return vocabulary, nil
}

func typeToModel(dbType queries.ImageType, conflictsWith []models.ImageTypeEnum) models.ImageType {
	// Non-null in the schema, so an unconflicted type gets an empty list
	// rather than a null a client would have to guard
	if conflictsWith == nil {
		conflictsWith = []models.ImageTypeEnum{}
	}
	slices.Sort(conflictsWith)

	return models.ImageType{
		Key:           models.ImageTypeEnum(dbType.Key),
		Name:          dbType.Name,
		Description:   dbType.Description,
		SortOrder:     dbType.SortOrder,
		EntityType:    models.ImageTypeScopeEnum(dbType.EntityType),
		Enabled:       dbType.Enabled,
		ConflictsWith: conflictsWith,
	}
}
