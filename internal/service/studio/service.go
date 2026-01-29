package studio

import (
	"context"
	"fmt"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

// Studio handles studio-related operations
type Studio struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

// NewStudio creates a new studio service
func NewStudio(queries *queries.Queries, withTxn queries.WithTxnFunc) *Studio {
	return &Studio{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Studio) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *Studio) FindByID(ctx context.Context, id uuid.UUID) (*models.Studio, error) {
	studio, err := s.queries.FindStudio(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.StudioToModelPtr(studio), nil
}

func (s *Studio) FindByName(ctx context.Context, name string) (*models.Studio, error) {
	studio, err := s.queries.FindStudioByName(ctx, strings.ToUpper(name))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.StudioToModelPtr(studio), nil
}

func (s *Studio) FindByAlias(ctx context.Context, alias string) (*models.Studio, error) {
	studio, err := s.queries.FindStudioByAlias(ctx, strings.ToUpper(alias))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.StudioToModelPtr(studio), nil
}

func (s *Studio) FindByParentID(ctx context.Context, parentID uuid.UUID) ([]models.Studio, error) {
	studios, err := s.queries.GetChildStudios(ctx, uuid.NullUUID{UUID: parentID, Valid: !parentID.IsNil()})
	if err != nil {
		return nil, err
	}
	return converter.StudiosToModels(studios), nil
}

func (s *Studio) CountByPerformer(ctx context.Context, performerID uuid.UUID) ([]models.PerformerStudio, error) {
	rows, err := s.queries.GetStudiosByPerformer(ctx, performerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get studios by performer: %w", err)
	}

	var result []models.PerformerStudio
	for _, row := range rows {
		// Create the PerformerStudio result
		performerStudio := models.PerformerStudio{
			Studio:     converter.StudioToModelPtr(row.Studio),
			SceneCount: int(row.SceneCount),
		}

		result = append(result, performerStudio)
	}

	return result, nil
}

func (s *Studio) GetChildren(ctx context.Context, studioID uuid.UUID) ([]models.Studio, error) {
	children, err := s.queries.GetChildStudios(ctx, uuid.NullUUID{UUID: studioID, Valid: !studioID.IsNil()})
	if err != nil {
		return nil, err
	}
	return converter.StudiosToModels(children), nil
}

func (s *Studio) GetAliases(ctx context.Context, studioID uuid.UUID) ([]string, error) {
	return s.queries.GetStudioAliases(ctx, studioID)
}

func (s *Studio) GetURLs(ctx context.Context, studioID uuid.UUID) ([]models.URL, error) {
	urls, err := s.queries.GetStudioURLs(ctx, studioID)
	if err != nil {
		return nil, err
	}

	var result []models.URL
	for _, url := range urls {
		result = append(result, models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	return result, nil
}

// Mutations

func (s *Studio) Create(ctx context.Context, input models.StudioCreateInput) (*models.Studio, error) {
	// Populate a new studio from the input
	newStudio, err := converter.StudioCreateInputToCreateParams(input)
	if err != nil {
		return nil, err
	}

	var studio *models.Studio
	err = s.withTxn(func(tx *queries.Queries) error {
		var err error
		dbStudio, err := tx.CreateStudio(ctx, newStudio)
		if err != nil {
			return err
		}
		studio = converter.StudioToModelPtr(dbStudio)

		// Save the aliases
		if err := createAliases(ctx, tx, studio.ID, input.Aliases); err != nil {
			return err
		}

		// Save the URLs
		if err := createURLs(ctx, tx, studio.ID, input.Urls); err != nil {
			return err
		}

		// Save the images
		return createImages(ctx, tx, studio.ID, input.ImageIds)
	})

	return studio, err
}

func (s *Studio) Update(ctx context.Context, input models.StudioUpdateInput) (*models.Studio, error) {
	var studio *models.Studio
	err := s.withTxn(func(tx *queries.Queries) error {
		// Get the existing studio and modify it
		existingStudio, err := tx.FindStudio(ctx, input.ID)
		if err != nil {
			return err
		}

		// Populate studio from the input
		params := converter.UpdateStudioFromUpdateInput(existingStudio, input)
		dbStudio, err := tx.UpdateStudio(ctx, params)
		if err != nil {
			return err
		}
		studio = converter.StudioToModelPtr(dbStudio)

		// TODO: only do this if provided
		// Save the aliases
		if err := updateAliases(ctx, tx, studio.ID, input.Aliases); err != nil {
			return err
		}

		// Save the URLs
		if err := updateURLs(ctx, tx, studio.ID, input.Urls); err != nil {
			return err
		}

		// Save the images
		return updateImages(ctx, tx, studio.ID, input.ImageIds)
	})

	return studio, err
}

func (s *Studio) Delete(ctx context.Context, id uuid.UUID) error {
	return s.withTxn(func(tx *queries.Queries) error {
		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly
		return tx.DeleteStudio(ctx, id)
	})
}

func (s *Studio) Favorite(ctx context.Context, id uuid.UUID, favorite bool) error {
	currentUser := auth.GetCurrentUser(ctx)
	return s.withTxn(func(tx *queries.Queries) error {
		studio, err := tx.FindStudio(ctx, id)
		if err != nil {
			return err
		}
		if studio.Deleted {
			return fmt.Errorf("studio is deleted, unable to make favorite")
		}

		if favorite {
			return tx.CreateStudioFavorite(ctx, queries.CreateStudioFavoriteParams{
				StudioID: studio.ID,
				UserID:   currentUser.ID,
			})
		}
		return tx.DeleteStudioFavorite(ctx, queries.DeleteStudioFavoriteParams{
			StudioID: studio.ID,
			UserID:   currentUser.ID,
		})
	})
}

func (s *Studio) Search(ctx context.Context, term string, limit int) ([]models.Studio, error) {
	studios, err := s.queries.SearchStudios(ctx, queries.SearchStudiosParams{
		Term:  &term,
		Limit: int32(limit),
	})

	return converter.StudiosToModels(studios), err
}

func createAliases(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, aliases []string) error {
	var params []queries.CreateStudioAliasesParams
	for _, alias := range aliases {
		params = append(params, queries.CreateStudioAliasesParams{
			StudioID: studioID,
			Alias:    alias,
		})
	}
	_, err := tx.CreateStudioAliases(ctx, params)
	return err
}

func updateAliases(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, aliases []string) error {
	if err := tx.DeleteStudioAliases(ctx, studioID); err != nil {
		return err
	}
	return createAliases(ctx, tx, studioID, aliases)
}

func createURLs(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, urls []models.URL) error {
	var params []queries.CreateStudioURLsParams
	for _, url := range urls {
		params = append(params, queries.CreateStudioURLsParams{
			StudioID: studioID,
			Url:      url.URL,
			SiteID:   url.SiteID,
		})
	}
	_, err := tx.CreateStudioURLs(ctx, params)
	return err
}

func updateURLs(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, urls []models.URL) error {
	if err := tx.DeleteStudioURLs(ctx, studioID); err != nil {
		return err
	}
	return createURLs(ctx, tx, studioID, urls)
}

func createImages(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, images []uuid.UUID) error {
	var params []queries.CreateStudioImagesParams
	for _, image := range images {
		params = append(params, queries.CreateStudioImagesParams{
			StudioID: studioID,
			ImageID:  image,
		})
	}

	_, err := tx.CreateStudioImages(ctx, params)
	return err
}

func updateImages(ctx context.Context, tx *queries.Queries, studioID uuid.UUID, images []uuid.UUID) error {
	// TODO Remove unused images
	if err := tx.DeleteStudioImages(ctx, studioID); err != nil {
		return err
	}
	return createImages(ctx, tx, studioID, images)
}

// Dataloader methods

func (s *Studio) LoadIds(ctx context.Context, ids []uuid.UUID) ([]*models.Studio, []error) {
	studios, err := s.queries.GetStudios(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]*models.Studio, len(ids))
	studioMap := make(map[uuid.UUID]*models.Studio)

	for _, studio := range studios {
		studioMap[studio.ID] = converter.StudioToModelPtr(studio)
	}

	for i, id := range ids {
		result[i] = studioMap[id]
	}

	return result, make([]error, len(ids))
}

// Dataloader for urls for multiple scenes
func (s *Studio) LoadURLs(ctx context.Context, ids []uuid.UUID) ([][]models.URL, []error) {
	urls, err := s.queries.FindStudioUrlsByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([][]models.URL, len(ids))
	urlMap := make(map[uuid.UUID][]models.URL)

	for _, url := range urls {
		urlMap[url.StudioID] = append(urlMap[url.StudioID], models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}

	for i, id := range ids {
		result[i] = urlMap[id]
	}

	return result, make([]error, len(ids))
}

func (s *Studio) LoadAliases(ctx context.Context, ids []uuid.UUID) ([][]string, []error) {
	aliases, err := s.queries.FindStudioAliasesByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([][]string, len(ids))
	aliasMap := make(map[uuid.UUID][]string)

	for _, alias := range aliases {
		aliasMap[alias.StudioID] = append(aliasMap[alias.StudioID], alias.Alias)
	}

	for i, id := range ids {
		result[i] = aliasMap[id]
	}

	return result, make([]error, len(ids))
}

func (s *Studio) LoadIsFavorite(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) ([]bool, []error) {
	favorites, err := s.queries.FindStudioFavoritesByIds(ctx, queries.FindStudioFavoritesByIdsParams{
		StudioIds: ids,
		UserID:    userID,
	})
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]bool, len(ids))
	favoriteMap := make(map[uuid.UUID]bool)

	for _, favorite := range favorites {
		favoriteMap[favorite.StudioID] = favorite.IsFavorite
	}

	for i, id := range ids {
		result[i] = favoriteMap[id]
	}

	return result, make([]error, len(ids))
}
