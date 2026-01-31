package performer

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
)

// Performer handles performer-related operations
type Performer struct {
	queries *queries.Queries
	withTxn queries.WithTxnFunc
}

// NewPerformer creates a new performer service
func NewPerformer(queries *queries.Queries, withTxn queries.WithTxnFunc) *Performer {
	return &Performer{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Performer) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *Performer) FindByID(ctx context.Context, id uuid.UUID) (*models.Performer, error) {
	performer, err := s.queries.FindPerformer(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.PerformerToModelPtr(performer), nil
}

func (s *Performer) FindByName(ctx context.Context, name string) (*models.Performer, error) {
	performer, err := s.queries.FindPerformerByName(ctx, strings.ToUpper(name))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.PerformerToModelPtr(performer), nil
}

func (s *Performer) FindByAlias(ctx context.Context, alias string) (*models.Performer, error) {
	performer, err := s.queries.FindPerformerByAlias(ctx, strings.ToUpper(alias))
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}
	return converter.PerformerToModelPtr(performer), nil
}

// Dataloader for performers
func (s *Performer) LoadByIds(ctx context.Context, ids []uuid.UUID) ([]*models.Performer, []error) {
	if len(ids) == 0 {
		return make([]*models.Performer, 0), nil
	}

	performers, err := s.queries.FindPerformersByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Create a map for quick lookup
	m := make(map[uuid.UUID]*models.Performer)
	for _, performer := range performers {
		modelPerformer := converter.PerformerToModel(performer)
		m[performer.ID] = &modelPerformer
	}

	// Build result in the same order as input IDs
	result := make([]*models.Performer, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloder for merge target IDs for performers
func (s *Performer) LoadMergeIDsByPerformerIDs(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	if len(ids) == 0 {
		return make([][]uuid.UUID, 0), nil
	}

	merges, err := s.queries.FindMergeIDsByPerformerIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]uuid.UUID)
	for _, merge := range merges {
		m[merge.PerformerID] = append(m[merge.PerformerID], merge.MergeID)
	}

	// Build result in the same order as input IDs
	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloader for merge source IDs for performers
func (s *Performer) LoadMergeIDsBySourcePerformerIDs(ctx context.Context, ids []uuid.UUID) ([][]uuid.UUID, []error) {
	if len(ids) == 0 {
		return make([][]uuid.UUID, 0), nil
	}

	merges, err := s.queries.FindMergeIDsBySourcePerformerIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]uuid.UUID)
	for _, merge := range merges {
		m[merge.PerformerID] = append(m[merge.PerformerID], merge.MergeID)
	}

	// Build result in the same order as input IDs
	result := make([][]uuid.UUID, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloader for aliases for multiple performers
func (s *Performer) LoadAliases(ctx context.Context, ids []uuid.UUID) ([][]string, []error) {
	if len(ids) == 0 {
		return make([][]string, 0), nil
	}

	aliases, err := s.queries.FindPerformerAliasesByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]string)
	for _, alias := range aliases {
		m[alias.PerformerID] = append(m[alias.PerformerID], alias.Alias)
	}

	// Build result in the same order as input IDs
	result := make([][]string, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloader for tattoos for multiple performers
func (s *Performer) LoadTattoos(ctx context.Context, ids []uuid.UUID) ([][]models.BodyModification, []error) {
	if len(ids) == 0 {
		return make([][]models.BodyModification, 0), nil
	}

	tattoos, err := s.queries.FindPerformerTattoosByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]models.BodyModification)
	for _, tattoo := range tattoos {
		bodyMod := models.BodyModification{
			Description: tattoo.Description,
		}
		if tattoo.Location != nil {
			bodyMod.Location = *tattoo.Location
		}
		m[tattoo.PerformerID] = append(m[tattoo.PerformerID], bodyMod)
	}

	// Build result in the same order as input IDs
	result := make([][]models.BodyModification, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloader for piercings for multiple performers
func (s *Performer) LoadPiercings(ctx context.Context, ids []uuid.UUID) ([][]models.BodyModification, []error) {
	if len(ids) == 0 {
		return make([][]models.BodyModification, 0), nil
	}

	piercings, err := s.queries.FindPerformerPiercingsByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]models.BodyModification)
	for _, piercing := range piercings {
		bodyMod := models.BodyModification{
			Description: piercing.Description,
		}
		if piercing.Location != nil {
			bodyMod.Location = *piercing.Location
		}
		m[piercing.PerformerID] = append(m[piercing.PerformerID], bodyMod)
	}

	// Build result in the same order as input IDs
	result := make([][]models.BodyModification, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Dataloader for URLs for multiple performers
func (s *Performer) LoadURLs(ctx context.Context, ids []uuid.UUID) ([][]models.URL, []error) {
	if len(ids) == 0 {
		return make([][]models.URL, 0), nil
	}

	urls, err := s.queries.FindPerformerUrlsByIds(ctx, ids)
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	// Group results by performer ID
	m := make(map[uuid.UUID][]models.URL)
	for _, url := range urls {
		urlModel := models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		}
		m[url.PerformerID] = append(m[url.PerformerID], urlModel)
	}

	// Build result in the same order as input IDs
	result := make([][]models.URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

func (s *Performer) GetAliases(ctx context.Context, performerID uuid.UUID) ([]string, error) {
	return s.queries.GetPerformerAliases(ctx, performerID)
}

func (s *Performer) GetTattoos(ctx context.Context, performerID uuid.UUID) ([]models.BodyModification, error) {
	tattoos, err := s.queries.GetPerformerTattoos(ctx, performerID)
	if err != nil {
		return nil, err
	}

	var result []models.BodyModification
	for _, tattoo := range tattoos {
		location := ""
		if tattoo.Location != nil {
			location = *tattoo.Location
		}

		result = append(result, models.BodyModification{
			Location:    location,
			Description: tattoo.Description,
		})
	}
	return result, nil
}

func (s *Performer) GetPiercings(ctx context.Context, performerID uuid.UUID) ([]models.BodyModification, error) {
	piercings, err := s.queries.GetPerformerPiercings(ctx, performerID)
	if err != nil {
		return nil, err
	}

	var result []models.BodyModification
	for _, piercing := range piercings {
		location := ""
		if piercing.Location != nil {
			location = *piercing.Location
		}

		result = append(result, models.BodyModification{
			Location:    location,
			Description: piercing.Description,
		})
	}
	return result, nil
}

func (s *Performer) GetURLs(ctx context.Context, performerID uuid.UUID) ([]models.URL, error) {
	urls, err := s.queries.GetPerformerURLs(ctx, performerID)
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

func (s *Performer) Create(ctx context.Context, input models.PerformerCreateInput) (*models.Performer, error) {
	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	newPerformer := converter.PerformerCreateInputToPerformer(input)
	newPerformer.ID = id

	var performer *models.Performer
	err = s.withTxn(func(tx *queries.Queries) error {
		dbPerformer, err := tx.CreatePerformer(ctx, converter.PerformerToCreateParams(newPerformer))
		if err != nil {
			return err
		}
		performer = converter.PerformerToModelPtr(dbPerformer)

		if err := createAliases(ctx, tx, id, input.Aliases); err != nil {
			return err
		}

		if err := createURLs(ctx, tx, id, input.Urls); err != nil {
			return err
		}

		if err := createPiercings(ctx, tx, id, converter.BodyModInputToModel(input.Piercings)); err != nil {
			return err
		}

		if err := createTattoos(ctx, tx, id, converter.BodyModInputToModel(input.Tattoos)); err != nil {
			return err
		}

		return createImages(ctx, tx, id, input.ImageIds)
	})

	return performer, err
}

func (s *Performer) Update(ctx context.Context, input models.PerformerUpdateInput) (*models.Performer, error) {
	var performer *models.Performer
	err := s.withTxn(func(tx *queries.Queries) error {
		// get the existing performer and modify it
		updatedPerformer, err := s.FindByID(ctx, input.ID)
		if err != nil {
			return err
		}

		// Populate performer from the input
		converter.UpdatePerformerFromUpdateInput(updatedPerformer, input)

		dbPerformer, err := tx.UpdatePerformer(ctx, converter.PerformerToUpdateParams(*updatedPerformer))
		if err != nil {
			return err
		}
		performer = converter.PerformerToModelPtr(dbPerformer)

		// Save the aliases
		if err := updateAliases(ctx, tx, performer.ID, input.Aliases); err != nil {
			return err
		}

		// Save the URLs
		if err := updateURLs(ctx, tx, performer.ID, input.Urls); err != nil {
			return err
		}

		// Save the Tattoos
		if err := updateTattoos(ctx, tx, performer.ID, converter.BodyModInputToModel(input.Tattoos)); err != nil {
			return err
		}

		// Save the Piercings
		if err := updatePiercings(ctx, tx, performer.ID, converter.BodyModInputToModel(input.Piercings)); err != nil {
			return err
		}

		// Update images
		return updateImages(ctx, tx, performer.ID, input.ImageIds)
	})

	// Commit
	if err != nil {
		return nil, err
	}

	return performer, nil

}

func (s *Performer) Delete(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeletePerformer(ctx, id)
}

func (s *Performer) Favorite(ctx context.Context, userID uuid.UUID, performerID uuid.UUID, favorite bool) error {
	performer, err := s.queries.FindPerformer(ctx, performerID)
	if err != nil {
		return fmt.Errorf("performer not found")
	}

	if performer.Deleted {
		return fmt.Errorf("performer is deleted, unable to make favorite")
	}

	if favorite {
		return s.queries.CreatePerformerFavorite(ctx, queries.CreatePerformerFavoriteParams{
			UserID:      userID,
			PerformerID: performerID,
		})
	}
	return s.queries.DeletePerformerFavorite(ctx, queries.DeletePerformerFavoriteParams{
		UserID:      userID,
		PerformerID: performerID,
	})
}

func (s *Performer) FindExistingPerformers(ctx context.Context, input models.QueryExistingPerformerInput) ([]models.Performer, error) {
	urls := input.Urls

	if input.Name == nil && len(urls) == 0 {
		return nil, nil
	}

	rows, err := s.queries.FindExistingPerformers(ctx, queries.FindExistingPerformersParams{
		Name:           input.Name,
		Disambiguation: input.Disambiguation,
		Urls:           urls,
	})

	return converter.PerformersToModels(rows), err
}

func (s *Performer) SearchPerformer(ctx context.Context, term string, limit *int, page *int, perPage *int, filter *models.PerformerSearchFilter) (*models.PerformerQuery, error) {
	trimmedQuery := strings.TrimSpace(strings.ToLower(term))
	performerID, err := uuid.FromString(trimmedQuery)
	if err == nil {
		var performers []models.Performer
		performer, err := s.queries.FindPerformer(ctx, performerID)
		if err == nil {
			performers = append(performers, converter.PerformerToModel(performer))
		}
		return &models.PerformerQuery{
			SearchResults: &models.PerformerSearchResults{
				Performers: performers,
				Count:      len(performers),
			},
		}, errutil.IgnoreNotFound(err)
	}

	searchLimit := 10
	searchOffset := 0

	if perPage != nil && *perPage > 0 {
		searchLimit = *perPage
	} else if limit != nil && *limit > 0 {
		searchLimit = *limit
	}

	if page != nil && *page > 1 {
		searchOffset = (*page - 1) * searchLimit
	}

	if strings.HasPrefix(trimmedQuery, "https://") || strings.HasPrefix(trimmedQuery, "http://") {
		rows, err := s.queries.FindPerformersByURL(ctx, queries.FindPerformersByURLParams{
			Url:   &trimmedQuery,
			Limit: int32(searchLimit),
		})
		performers := converter.PerformersToModels(rows)
		return &models.PerformerQuery{
			SearchResults: &models.PerformerSearchResults{
				Performers: performers,
				Count:      len(performers),
			},
		}, err
	}

	var filterGender *string
	if filter != nil {
		if filter.Gender != nil {
			genderStr := string(*filter.Gender)
			filterGender = &genderStr
		}
	}

	rows, err := s.queries.SearchPerformersWithFacets(ctx, queries.SearchPerformersWithFacetsParams{
		Term:         &trimmedQuery,
		Limit:        int32(searchLimit),
		Offset:       int32(searchOffset),
		FilterGender: filterGender,
	})
	if err != nil {
		return nil, err
	}

	ids := make([]uuid.UUID, len(rows))
	for i, row := range rows {
		ids[i] = row.PerformerID
	}

	performerPtrs, _ := s.LoadByIds(ctx, ids)
	performers := make([]models.Performer, 0, len(performerPtrs))
	for _, p := range performerPtrs {
		if p != nil && !p.Deleted {
			performers = append(performers, *p)
		}
	}

	// Parse facets and count from the first row (all rows have the same aggregated values)
	var facets *models.PerformerSearchFacets
	count := 0
	if len(rows) > 0 {
		facets = parsePerformerFacets(rows[0].GenderFacets)
		count = parseParadeDBCount(rows[0].TotalCount)
	}

	return &models.PerformerQuery{
		SearchResults: &models.PerformerSearchResults{
			Performers: performers,
			Count:      count,
			Facets:     facets,
		},
	}, nil
}

type paradeDBCountResult struct {
	Value float64 `json:"value"`
}

func parseParadeDBCount(raw any) int {
	if raw == nil {
		return 0
	}
	jsonBytes, err := json.Marshal(raw)
	if err != nil {
		return 0
	}
	var result paradeDBCountResult
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		return 0
	}
	return int(result.Value)
}

type paradeDBFacetResult struct {
	Buckets []paradeDBBucket `json:"buckets"`
}

type paradeDBBucket struct {
	Key      string `json:"key"`
	DocCount int    `json:"doc_count"`
}

func parsePerformerFacets(genderFacetsRaw any) *models.PerformerSearchFacets {
	facets := &models.PerformerSearchFacets{}

	if genderFacetsRaw != nil {
		if genderBytes, err := json.Marshal(genderFacetsRaw); err == nil {
			var genderResult paradeDBFacetResult
			if err := json.Unmarshal(genderBytes, &genderResult); err == nil {
				for _, bucket := range genderResult.Buckets {
					if gender := models.GenderEnum(bucket.Key); gender.IsValid() {
						facets.Genders = append(facets.Genders, models.GenderFacet{
							Gender: gender,
							Count:  bucket.DocCount,
						})
					}
				}
			}
		}
	}

	return facets
}

func (s *Performer) LoadIsFavorite(ctx context.Context, userID uuid.UUID, ids []uuid.UUID) ([]bool, []error) {
	favorites, err := s.queries.FindPerformerFavoritesByIds(ctx, queries.FindPerformerFavoritesByIdsParams{
		PerformerIds: ids,
		UserID:       userID,
	})
	if err != nil {
		return nil, errutil.DuplicateError(err, len(ids))
	}

	result := make([]bool, len(ids))
	favoriteMap := make(map[uuid.UUID]bool)

	for _, favorite := range favorites {
		favoriteMap[favorite.PerformerID] = favorite.IsFavorite
	}

	for i, id := range ids {
		result[i] = favoriteMap[id]
	}

	return result, make([]error, len(ids))
}
