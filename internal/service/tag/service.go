package tag

import (
	"context"
	"errors"
	"strings"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

// Service handles tag-related operations
type Tag struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

// NewTag creates a new tag service
func NewTag(queries *db.Queries, withTxn db.WithTxnFunc) *Tag {
	return &Tag{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Tag) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *Tag) FindByID(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	tag, err := s.queries.FindTag(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.TagToModel(tag), nil
}

// Find is an alias for FindByID to match repository interface
func (s *Tag) Find(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	return s.FindByID(ctx, id)
}

func (s *Tag) FindByName(ctx context.Context, name string) (*models.Tag, error) {
	tag, err := s.queries.FindTagByName(ctx, strings.ToUpper(name))
	if err != nil {
		return nil, err
	}
	return converter.TagToModel(tag), nil
}

func (s *Tag) FindByAlias(ctx context.Context, alias string) (*models.Tag, error) {
	tag, err := s.queries.FindTagByAlias(ctx, strings.ToUpper(alias))
	if err != nil {
		return nil, err
	}
	return converter.TagToModel(tag), nil
}

// FindByNameOrAlias attempts to find a tag by name first, then by alias
func (s *Tag) FindByNameOrAlias(ctx context.Context, name string) (*models.Tag, error) {
	// Try to find by name first
	tag, err := s.FindByName(ctx, name)
	if err == nil {
		return tag, nil
	}

	// If not found by name, try by alias
	tag, err = s.FindByAlias(ctx, name)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return tag, nil
}

func (s *Tag) FindCategory(ctx context.Context, id uuid.UUID) (*models.TagCategory, error) {
	category, err := s.queries.FindTagCategory(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.TagCategoryToModel(category), nil
}

// FindIdsBySceneIds returns tag IDs for multiple scene IDs, used by dataloader
func (s *Tag) FindIdsBySceneIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	if len(ids) == 0 {
		return make([][]uuid.UUID, 0), nil
	}

	sceneTags, err := s.queries.FindTagIdsBySceneIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	// Group results by scene ID
	m := make(map[uuid.UUID][]uuid.UUID)
	for _, st := range sceneTags {
		m[st.SceneID] = append(m[st.SceneID], st.TagID)
	}

	// Build result in the same order as input IDs
	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

func (s *Tag) GetAliases(ctx context.Context, tagID uuid.UUID) ([]string, error) {
	return s.queries.GetTagAliases(ctx, tagID)
}

// Mutations

func (s *Tag) Create(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	var tag db.Tag
	err := s.withTxn(func(tx *db.Queries) error {
		params, err := converter.TagCreateInputToCreateParams(input)
		if err != nil {
			return err
		}

		tag, err = tx.CreateTag(ctx, params)
		if err != nil {
			return err
		}

		return createAliases(ctx, tx, tag.ID, input.Aliases)
	})

	return converter.TagToModel(tag), err
}

func (s *Tag) Update(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	var tag db.Tag
	err := s.withTxn(func(tx *db.Queries) error {
		existingTag, err := tx.FindTag(ctx, input.ID)
		if err != nil {
			return err
		}

		params := converter.UpdateTagFromUpdateInput(existingTag, input)
		tag, err = tx.UpdateTag(ctx, params)
		if err != nil {
			return err
		}

		return updateAliases(ctx, tx, tag.ID, input.Aliases)
	})

	return converter.TagToModel(tag), err
}

func (s *Tag) Delete(ctx context.Context, input models.TagDestroyInput) error {
	return s.withTxn(func(tx *db.Queries) error {
		return tx.DeleteTag(ctx, input.ID)
	})
}

func (s *Tag) CreateCategory(ctx context.Context, input models.TagCategoryCreateInput) (*models.TagCategory, error) {
	params, err := converter.TagCategoryCreateInputToCreateParams(input)
	if err != nil {
		return nil, err
	}

	var category db.TagCategory
	err = s.withTxn(func(tx *db.Queries) error {
		category, err = tx.CreateTagCategory(ctx, params)
		return err
	})

	return converter.TagCategoryToModel(category), err
}

func (s *Tag) UpdateCategory(ctx context.Context, input models.TagCategoryUpdateInput) (*models.TagCategory, error) {
	var category db.TagCategory
	err := s.withTxn(func(tx *db.Queries) error {
		existingCategory, err := tx.FindTagCategory(ctx, input.ID)
		if err != nil {
			return err
		}

		updatedCategory := converter.UpdateTagCategoryFromUpdateInput(existingCategory, input)
		category, err = tx.UpdateTagCategory(ctx, updatedCategory)

		return err
	})

	return converter.TagCategoryToModel(category), err
}

func (s *Tag) DeleteCategory(ctx context.Context, input models.TagCategoryDestroyInput) error {
	return s.withTxn(func(tx *db.Queries) error {
		return tx.DeleteTagCategory(ctx, input.ID)
	})
}

func (s *Tag) QueryCategories(ctx context.Context) (int, []*models.TagCategory, error) {
	categories, err := s.queries.GetAllTagCategories(ctx)
	return len(categories), converter.TagCategoriesToModels(categories), err
}

func (s *Tag) SearchTags(ctx context.Context, term string, limit int) ([]*models.Tag, error) {
	tags, err := s.queries.SearchTags(ctx, db.SearchTagsParams{
		Term:  &term,
		Limit: int32(limit),
	})
	return converter.TagsToModels(tags), err
}

func createAliases(ctx context.Context, tx *db.Queries, tagID uuid.UUID, aliases []string) error {
	var params []db.CreateTagAliasesParams
	for _, alias := range aliases {
		params = append(params, db.CreateTagAliasesParams{
			TagID: tagID,
			Alias: alias,
		})
	}
	_, err := tx.CreateTagAliases(ctx, params)
	return err
}

func updateAliases(ctx context.Context, tx *db.Queries, tagID uuid.UUID, aliases []string) error {
	if err := tx.DeleteTagAliases(ctx, tagID); err != nil {
		return err
	}
	return createAliases(ctx, tx, tagID, aliases)
}

// Dataloader methods

func (s *Tag) FindByIds(ctx context.Context, ids []uuid.UUID) ([]*models.Tag, []error) {
	tags, err := s.queries.FindTagsByIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([]*models.Tag, len(ids))
	tagMap := make(map[uuid.UUID]*models.Tag)

	for _, tag := range tags {
		tagMap[tag.ID] = converter.TagToModel(tag)
	}

	for i, id := range ids {
		result[i] = tagMap[id]
	}

	return result, make([]error, len(ids))
}

func (s *Tag) FindCategoriesByIds(ctx context.Context, ids []uuid.UUID) ([]*models.TagCategory, []error) {
	categories, err := s.queries.GetTagCategoriesByIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([]*models.TagCategory, len(ids))
	categoryMap := make(map[uuid.UUID]*models.TagCategory)

	for _, category := range categories {
		categoryMap[category.ID] = converter.TagCategoryToModel(category)
	}

	for i, id := range ids {
		result[i] = categoryMap[id]
	}

	return result, make([]error, len(ids))
}
