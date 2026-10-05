package tag

import (
	"context"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/internal/service/loadutil"
)

// Service handles tag-related operations
type Tag struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

// NewTag creates a new tag service
func NewTag(queries *queries.Queries, withTxn queries.WithTxnFunc) *Tag {
	return &Tag{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Tag) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *Tag) FindByID(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	tag, err := s.queries.FindTag(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.TagToModelPtr(tag), nil
}

// Find is an alias for FindByID to match repository interface
func (s *Tag) Find(ctx context.Context, id uuid.UUID) (*models.Tag, error) {
	return s.FindByID(ctx, id)
}

func (s *Tag) FindByName(ctx context.Context, name string) (*models.Tag, error) {
	tag, err := s.queries.FindTagByName(ctx, strings.ToUpper(name))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.TagToModelPtr(tag), nil
}

func (s *Tag) FindByAlias(ctx context.Context, alias string) (*models.Tag, error) {
	tag, err := s.queries.FindTagByAlias(ctx, strings.ToUpper(alias))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.TagToModelPtr(tag), nil
}

// FindByNameOrAlias attempts to find a tag by name first, then by alias
func (s *Tag) FindByNameOrAlias(ctx context.Context, name string) (*models.Tag, error) {
	// Try to find by name first
	tag, err := s.FindByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if tag != nil {
		return tag, nil
	}

	// If not found by name, try by alias
	tag, err = s.FindByAlias(ctx, name)
	if err != nil {
		return nil, err
	}
	return tag, nil
}

func (s *Tag) FindCategory(ctx context.Context, id uuid.UUID) (*models.TagCategory, error) {
	category, err := s.queries.FindTagCategory(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.TagCategoryToModelPtr(category), nil
}

// FindIdsBySceneIds returns tag IDs for multiple scene IDs, used by dataloader
func (s *Tag) FindIdsBySceneIds(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	return loadutil.Many(ids,
		func(ids []uuid.UUID) ([]queries.SceneTag, error) { return s.queries.FindTagIdsBySceneIds(ctx, ids) },
		func(tag queries.SceneTag) uuid.UUID { return tag.SceneID },
		func(tag queries.SceneTag) uuid.UUID { return tag.TagID },
	)

}

func (s *Tag) GetAliases(ctx context.Context, tagID uuid.UUID) ([]string, error) {
	return s.queries.GetTagAliases(ctx, tagID)
}

// Dataloader for aliases for multiple tags
func (s *Tag) LoadAliases(ctx context.Context, ids []uuid.UUID) ([][]string, []error) {
	return loadutil.Many(ids,
		func(ids []uuid.UUID) ([]queries.TagAlias, error) { return s.queries.FindTagAliasesByIds(ctx, ids) },
		func(alias queries.TagAlias) uuid.UUID { return alias.TagID },
		func(alias queries.TagAlias) string { return alias.Alias },
	)

}

// Mutations

func (s *Tag) Create(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	var tag queries.Tag
	err := s.withTxn(func(tx *queries.Queries) error {
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

	return converter.TagToModelPtr(tag), err
}

func (s *Tag) Update(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	var tag queries.Tag
	err := s.withTxn(func(tx *queries.Queries) error {
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

	return converter.TagToModelPtr(tag), err
}

func (s *Tag) Delete(ctx context.Context, input models.TagDestroyInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteTag(ctx, input.ID)
	})
}

func (s *Tag) CreateCategory(ctx context.Context, input models.TagCategoryCreateInput) (*models.TagCategory, error) {
	params, err := converter.TagCategoryCreateInputToCreateParams(input)
	if err != nil {
		return nil, err
	}

	var category queries.TagCategory
	err = s.withTxn(func(tx *queries.Queries) error {
		category, err = tx.CreateTagCategory(ctx, params)
		return err
	})

	return converter.TagCategoryToModelPtr(category), err
}

func (s *Tag) UpdateCategory(ctx context.Context, input models.TagCategoryUpdateInput) (*models.TagCategory, error) {
	var category queries.TagCategory
	err := s.withTxn(func(tx *queries.Queries) error {
		existingCategory, err := tx.FindTagCategory(ctx, input.ID)
		if err != nil {
			return err
		}

		updatedCategory := converter.UpdateTagCategoryFromUpdateInput(existingCategory, input)
		category, err = tx.UpdateTagCategory(ctx, updatedCategory)

		return err
	})

	return converter.TagCategoryToModelPtr(category), err
}

func (s *Tag) DeleteCategory(ctx context.Context, input models.TagCategoryDestroyInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		return tx.DeleteTagCategory(ctx, input.ID)
	})
}

func (s *Tag) QueryCategories(ctx context.Context) (int, []models.TagCategory, error) {
	categories, err := s.queries.GetAllTagCategories(ctx)
	return len(categories), converter.TagCategoriesToModels(categories), err
}

func (s *Tag) SearchTags(ctx context.Context, term string, limit int) ([]models.Tag, error) {
	tags, err := s.queries.SearchTags(ctx, queries.SearchTagsParams{
		Term:  &term,
		Limit: int32(limit),
	})
	return converter.TagsToModels(tags), err
}

func createAliases(ctx context.Context, tx *queries.Queries, tagID uuid.UUID, aliases []string) error {
	var params []queries.CreateTagAliasesParams
	for _, alias := range aliases {
		params = append(params, queries.CreateTagAliasesParams{
			TagID: tagID,
			Alias: alias,
		})
	}
	_, err := tx.CreateTagAliases(ctx, params)
	return err
}

func updateAliases(ctx context.Context, tx *queries.Queries, tagID uuid.UUID, aliases []string) error {
	if err := tx.DeleteTagAliases(ctx, tagID); err != nil {
		return err
	}
	return createAliases(ctx, tx, tagID, aliases)
}

// Dataloader methods

func (s *Tag) LoadIds(ctx context.Context, ids []uuid.UUID) ([]*models.Tag, []error) {
	return loadutil.One(ids,
		func(ids []uuid.UUID) ([]queries.Tag, error) { return s.queries.FindTagsByIds(ctx, ids) },
		func(tag queries.Tag) uuid.UUID { return tag.ID },
		converter.TagToModelPtr,
	)
}

func (s *Tag) LoadCategoriesByIds(ctx context.Context, ids []uuid.UUID) ([]*models.TagCategory, []error) {
	return loadutil.One(ids,
		func(ids []uuid.UUID) ([]queries.TagCategory, error) { return s.queries.GetTagCategoriesByIds(ctx, ids) },
		func(category queries.TagCategory) uuid.UUID { return category.ID },
		converter.TagCategoryToModelPtr,
	)
}
