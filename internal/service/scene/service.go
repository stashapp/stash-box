package scene

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

// Scene handles scene-related operations
type Scene struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

// NewScene creates a new scene service
func NewScene(queries *db.Queries, withTxn db.WithTxnFunc) *Scene {
	return &Scene{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *Scene) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *Scene) FindByID(ctx context.Context, id uuid.UUID) (*models.Scene, error) {
	scene, err := s.queries.FindScene(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return converter.SceneToModel(scene), nil
}

func (s *Scene) FindByTitle(ctx context.Context, title string) (*models.Scene, error) {
	scene, err := s.queries.FindSceneByTitle(ctx, strings.ToUpper(title))
	if err != nil {
		return nil, err
	}
	return converter.SceneToModel(scene), nil
}

func (s *Scene) FindByFingerprint(ctx context.Context, algorithm models.FingerprintAlgorithm, hash string) ([]*models.Scene, error) {
	scenes, err := s.queries.FindScenesByFingerprint(ctx, db.FindScenesByFingerprintParams{
		Hash:      hash,
		Algorithm: algorithm.String(),
	})

	return converter.ScenesToModels(scenes), err
}

func (s *Scene) FindByFingerprints(ctx context.Context, fingerprints []string) ([]*models.Scene, error) {
	scenes, err := s.queries.FindScenesByFingerprints(ctx, fingerprints)
	return converter.ScenesToModels(scenes), err
}

func (s *Scene) FindByURL(ctx context.Context, url string, limit int) ([]*models.Scene, error) {
	scenes, err := s.queries.FindSceneByURL(ctx, db.FindSceneByURLParams{
		Url:   pgtype.Text{String: url, Valid: true},
		Limit: pgtype.Int4{Int32: int32(limit), Valid: true},
	})
	return converter.ScenesToModels(scenes), err
}

func (s *Scene) FindByFullFingerprints(ctx context.Context, fingerprints []*models.FingerprintQueryInput) ([]*models.Scene, error) {
	var phashes []int64
	var hashes []string

	distance := config.GetPHashDistance()
	for _, fp := range fingerprints {
		if fp.Algorithm == models.FingerprintAlgorithmPhash && distance > 0 {
			// Postgres only supports signed integers, so we parse
			// as uint64 and cast to int64 to ensure values are the same.
			value, err := strconv.ParseUint(fp.Hash, 16, 64)
			if err == nil {
				phashes = append(phashes, int64(value))
			}
		} else {
			hashes = append(hashes, fp.Hash)
		}
	}

	scenes, err := s.queries.FindScenesByFullFingerprints(ctx, db.FindScenesByFullFingerprintsParams{
		Phashes:  phashes,
		Hashes:   hashes,
		Distance: pgtype.Int4{Int32: int32(distance), Valid: true},
	})
	return converter.ScenesToModels(scenes), err
}

func (s *Scene) FindScenesBySceneFingerprints(ctx context.Context, sceneFingerprints [][]*models.FingerprintQueryInput) ([][]*models.Scene, error) {
	var fingerprints []*models.FingerprintQueryInput
	for _, scene := range sceneFingerprints {
		fingerprints = append(fingerprints, scene...)
	}

	var phashes []int64
	var hashes []string

	distance := config.GetPHashDistance()
	for _, fp := range fingerprints {
		if fp.Algorithm == models.FingerprintAlgorithmPhash && distance > 0 {
			// Postgres only supports signed integers, so we parse
			// as uint64 and cast to int64 to ensure values are the same.
			value, err := strconv.ParseUint(fp.Hash, 16, 64)
			if err == nil {
				phashes = append(phashes, int64(value))
			}
		} else {
			hashes = append(hashes, fp.Hash)
		}
	}

	rows, err := s.queries.FindScenesByFullFingerprintsWithHash(ctx, db.FindScenesByFullFingerprintsWithHashParams{
		Phashes:  phashes,
		Hashes:   hashes,
		Distance: pgtype.Int4{Int32: int32(distance), Valid: true},
	})
	if err != nil || len(rows) == 0 {
		return make([][]*models.Scene, len(sceneFingerprints)), err
	}

	sceneMap := make(map[string]*models.Scene)
	for _, row := range rows {
		sceneMap[row.Hash] = converter.SceneToModel(row.Scene)
	}

	// Deduplicate list of scenes for each group of fingerprints
	var result = make([][]*models.Scene, len(sceneFingerprints))
	for i, fingerprints := range sceneFingerprints {
		for _, fp := range fingerprints {
			scene, match := sceneMap[fp.Hash]
			if match {
				result[i] = append(result[i], scene)
			}
		}
	}

	return result, nil
}

func (s *Scene) SearchScenes(ctx context.Context, term string, limit int) ([]*models.Scene, error) {
	scenes, err := s.queries.SearchScenes(ctx, db.SearchScenesParams{
		Term:  pgtype.Text{String: term, Valid: true},
		Limit: pgtype.Int4{Int32: int32(limit), Valid: true},
	})
	return converter.ScenesToModels(scenes), err
}

func (s *Scene) Count(ctx context.Context) (int, error) {
	count, err := s.queries.CountScenes(ctx)
	return int(count), err
}

func (s *Scene) CountByPerformer(ctx context.Context, performerID uuid.UUID) (int, error) {
	count, err := s.queries.CountScenesByPerformer(ctx, performerID)
	if err != nil {
		return 0, fmt.Errorf("failed to count scenes by performer: %w", err)
	}
	return int(count), nil
}

func (s *Scene) GetPerformers(ctx context.Context, sceneID uuid.UUID) ([]*models.PerformerAppearance, error) {
	performers, err := s.queries.GetScenePerformers(ctx, sceneID)
	if err != nil {
		return nil, err
	}

	var result []*models.PerformerAppearance
	for _, row := range performers {
		var asName *string
		if row.As.Valid {
			asName = &row.As.String
		}

		result = append(result, &models.PerformerAppearance{
			Performer: converter.PerformerToModel(row.Performer),
			As:        asName,
		})
	}
	return result, nil
}

func (s *Scene) GetTags(ctx context.Context, sceneID uuid.UUID) ([]*models.Tag, error) {
	dbTags, err := s.queries.GetSceneTags(ctx, sceneID)
	if err != nil {
		return nil, err
	}

	var tags []*models.Tag
	for _, tag := range dbTags {
		tags = append(tags, converter.TagToModel(tag))
	}
	return tags, nil
}

func (s *Scene) GetURLs(ctx context.Context, sceneID uuid.UUID) ([]*models.URL, error) {
	urls, err := s.queries.GetSceneURLs(ctx, sceneID)
	if err != nil {
		return nil, err
	}

	var result []*models.URL
	for _, url := range urls {
		result = append(result, &models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		})
	}
	return result, nil
}

func (s *Scene) GetFingerprints(ctx context.Context, sceneID uuid.UUID) ([]*models.Fingerprint, error) {
	fingerprints, err := s.queries.GetAllSceneFingerprints(ctx, sceneID)
	if err != nil {
		return nil, err
	}

	var result []*models.Fingerprint
	for _, fp := range fingerprints {
		result = append(result, &models.Fingerprint{
			Hash:      fp.Hash,
			Algorithm: models.FingerprintAlgorithm(fp.Algorithm),
			Duration:  int(fp.Duration),
			Created:   fp.CreatedAt.Time,
		})
	}
	return result, nil
}

// GetAllFingerprints retrieves fingerprints for multiple scenes with aggregated vote data
func (s *Scene) GetAllFingerprints(ctx context.Context, currentUserID uuid.UUID, ids []uuid.UUID, onlySubmitted bool) ([][]*models.Fingerprint, []error) {
	if len(ids) == 0 {
		return make([][]*models.Fingerprint, 0), nil
	}

	// Prepare parameters for the query
	var filterUserID uuid.NullUUID
	if onlySubmitted {
		filterUserID = uuid.NullUUID{UUID: currentUserID, Valid: true}
	}

	params := db.GetAllFingerprintsParams{
		CurrentUserID: currentUserID, // Always pass for user_submitted/user_reported checks
		SceneIds:      ids,           // Scene IDs to query
		FilterUserID:  filterUserID,  // Pass user ID when filtering, nil UUID when not
	}

	rows, err := s.queries.GetAllFingerprints(ctx, params)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	// Group results by scene ID
	m := make(map[uuid.UUID][]*models.Fingerprint)
	for _, row := range rows {
		// Convert the database row to models.Fingerprint
		fp := &models.Fingerprint{
			Hash:          row.Hash,
			Algorithm:     models.FingerprintAlgorithm(row.Algorithm),
			Duration:      int(row.Duration),
			Submissions:   int(row.Submissions),
			Reports:       int(row.Reports),
			UserSubmitted: row.UserSubmitted,
			UserReported:  row.UserReported,
		}

		// Handle timestamps (pgtype.Timestamp)
		if row.CreatedAt.Valid {
			fp.Created = row.CreatedAt.Time
		}
		if row.UpdatedAt.Valid {
			fp.Updated = row.UpdatedAt.Time
		}

		m[row.SceneID] = append(m[row.SceneID], fp)
	}

	// Build result in the same order as input IDs
	result := make([][]*models.Fingerprint, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// GetAllAppearances returns performer appearances for multiple scenes
func (s *Scene) GetAllAppearances(ctx context.Context, ids []uuid.UUID) ([][]*models.PerformerScene, []error) {
	if len(ids) == 0 {
		return make([][]*models.PerformerScene, 0), nil
	}

	appearances, err := s.queries.FindSceneAppearancesByIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	// Group results by scene ID
	m := make(map[uuid.UUID][]*models.PerformerScene)
	for _, appearance := range appearances {
		performerScene := &models.PerformerScene{
			PerformerID: appearance.PerformerID,
		}
		if appearance.As.Valid {
			performerScene.As = &appearance.As.String
		}
		m[appearance.SceneID] = append(m[appearance.SceneID], performerScene)
	}

	// Build result in the same order as input IDs
	result := make([][]*models.PerformerScene, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// GetAllURLs returns URLs for multiple scenes
func (s *Scene) GetAllURLs(ctx context.Context, ids []uuid.UUID) ([][]*models.URL, []error) {
	if len(ids) == 0 {
		return make([][]*models.URL, 0), nil
	}

	urls, err := s.queries.FindSceneUrlsByIds(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	// Group results by scene ID
	m := make(map[uuid.UUID][]*models.URL)
	for _, url := range urls {
		urlModel := &models.URL{
			URL:    url.Url,
			SiteID: url.SiteID,
		}
		m[url.SceneID] = append(m[url.SceneID], urlModel)
	}

	// Build result in the same order as input IDs
	result := make([][]*models.URL, len(ids))
	for i, id := range ids {
		result[i] = m[id]
	}

	return result, nil
}

// Mutations

func (s *Scene) Create(ctx context.Context, input models.SceneCreateInput) (*models.Scene, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new scene from the input
	newScene := converter.SceneCreateInputToScene(input)
	currentTime := time.Now()
	newScene.ID = id
	newScene.CreatedAt = currentTime
	newScene.UpdatedAt = currentTime

	var scene models.Scene
	err = s.withTxn(func(tx *db.Queries) error {
		dbScene, err := tx.CreateScene(ctx, converter.SceneToCreateParams(newScene))
		if err != nil {
			return err
		}
		scene = *converter.SceneToModel(dbScene)

		// Save the fingerprints
		if err := createFingerprints(ctx, tx, newScene.ID, input.Fingerprints); err != nil {
			return err
		}

		// save the performers
		if err := createPerformers(ctx, tx, scene.ID, input.Performers); err != nil {
			return err
		}

		// Save the URLs
		if err := createURLs(ctx, tx, scene.ID, input.Urls); err != nil {
			return err
		}

		// Save the tags
		if err := createTags(ctx, tx, scene.ID, input.TagIds); err != nil {
			return err
		}

		// Save the images
		return createImages(ctx, tx, scene.ID, input.ImageIds)
	})

	return &scene, err
}

func (s *Scene) Update(ctx context.Context, input models.SceneUpdateInput) (*models.Scene, error) {
	// Get the existing scene and modify it
	dbScene, err := s.queries.FindScene(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	updatedScene := converter.SceneToModel(dbScene)
	updatedScene.UpdatedAt = time.Now()

	// Populate scene from the input
	converter.UpdateSceneFromUpdateInput(updatedScene, input)

	if err := s.withTxn(func(tx *db.Queries) error {
		scene, err := tx.UpdateScene(ctx, converter.SceneToUpdateParams(*updatedScene))
		if err != nil {
			return err
		}

		// Save the checksums
		userID := auth.GetCurrentUser(ctx).ID
		if err := updateFingerprints(ctx, tx, scene.ID, userID, input.Fingerprints); err != nil {
			return err
		}

		if err := updatePerformers(ctx, tx, scene.ID, input.Performers); err != nil {
			return err
		}

		// Save the tags
		if err := updateTags(ctx, tx, scene.ID, input.TagIds); err != nil {
			return err
		}

		// Save the URLs
		if err := updateURLs(ctx, tx, scene.ID, input.Urls); err != nil {
			return err
		}

		// Save the images
		return updateImages(ctx, tx, scene.ID, input.ImageIds)
	}); err != nil {
		return nil, err
	}

	return updatedScene, nil
}

func (s *Scene) Delete(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeleteScene(ctx, id)
}

func (s *Scene) SubmitFingerprint(ctx context.Context, input models.FingerprintSubmission) (bool, error) {
	// Find the scene
	dbScene, err := s.queries.FindScene(ctx, input.SceneID)

	if err != nil || dbScene.Deleted {
		// FIXME: this should error out, but due to the use-case in Stash,
		//       it will stop submitting fingerprints if a single one fails
		//       see https://github.com/stashapp/stash/blob/v0.16.1/pkg/scraper/stashbox/stash_box.go#L254-L257
		return true, nil
		// return false, fmt.Errorf("scene is deleted, unable to submit fingerprint")
	}

	// if no user is set, or if the current user does not have the modify
	// role, then set users to the current user
	if len(input.Fingerprint.UserIds) == 0 || !auth.IsRole(ctx, models.RoleEnumModify) {
		currentUserID := auth.GetCurrentUser(ctx).ID
		input.Fingerprint.UserIds = []uuid.UUID{currentUserID}
	}

	// set the default vote
	vote := models.FingerprintSubmissionTypeValid
	if input.Vote != nil {
		vote = *input.Vote
	}

	// if the user is reporting a fingerprint, ensure that the fingerprint has at least one submission
	if vote == models.FingerprintSubmissionTypeInvalid {
		submissionExists, err := s.queries.SubmittedHashExists(ctx, db.SubmittedHashExistsParams{
			SceneID:   input.SceneID,
			Hash:      input.Fingerprint.Hash,
			Algorithm: input.Fingerprint.Algorithm.String(),
		})
		if err != nil {
			return false, err
		}

		if !submissionExists {
			return false, errors.New("fingerprint has no submissions")
		}
	}

	voteInt := submissionTypeToInt(vote)
	sceneFingerprint := createSubmittedSceneFingerprints(input.SceneID, []*models.FingerprintInput{input.Fingerprint}, voteInt)

	// vote == 0 means the user is unmatching the fingerprint
	// Unmatch is the deprecated field, but we still need to support it
	unmatch := vote == models.FingerprintSubmissionTypeRemove || (input.Unmatch != nil && *input.Unmatch)

	if !unmatch {
		// set the new fingerprints
		for _, fp := range sceneFingerprint {
			id, err := getOrCreateFingerprint(ctx, s.queries, fp.Hash, fp.Algorithm)
			if err != nil {
				return false, err
			}
			if err := s.queries.CreateOrReplaceFingerprint(ctx, db.CreateOrReplaceFingerprintParams{
				FingerprintID: id,
				SceneID:       fp.SceneID,
				UserID:        fp.UserID,
				Duration:      int32(fp.Duration),
				Vote:          int16(voteInt),
			}); err != nil {
				return false, err
			}
		}
	} else {
		// remove fingerprints that match the user id, algorithm and hash
		for _, fp := range sceneFingerprint {
			if err := s.queries.DeleteSceneFingerprint(ctx, db.DeleteSceneFingerprintParams{
				Hash:      fp.Hash,
				Algorithm: fp.Algorithm,
				UserID:    fp.UserID,
				SceneID:   fp.SceneID,
			}); err != nil {
				return false, err
			}
		}
	}

	return true, nil
}

func (s *Scene) FindExistingScenes(ctx context.Context, input models.QueryExistingSceneInput) ([]*models.Scene, error) {
	var hashes []string
	var studioID uuid.NullUUID
	var title pgtype.Text

	if input.StudioID != nil {
		studioID = uuid.NullUUID{UUID: *input.StudioID, Valid: true}
	}
	if input.Title != nil {
		title = pgtype.Text{String: *input.Title, Valid: true}
	}
	for _, fp := range input.Fingerprints {
		hashes = append(hashes, fp.Hash)
	}

	scenes, err := s.queries.FindExistingScenes(ctx, db.FindExistingScenesParams{
		Hashes:   hashes,
		Title:    title,
		StudioID: studioID,
	})

	return converter.ScenesToModels(scenes), err
}

func submissionTypeToInt(t models.FingerprintSubmissionType) int {
	switch t {
	case models.FingerprintSubmissionTypeValid:
		return 1
	case models.FingerprintSubmissionTypeInvalid:
		return -1
	default:
		return 0
	}
}

func createSubmittedSceneFingerprints(sceneID uuid.UUID, fingerprints []*models.FingerprintInput, vote int) []*models.SceneFingerprint {
	var ret []*models.SceneFingerprint

	for _, fingerprint := range fingerprints {
		if fingerprint.Duration > 0 {
			for _, userID := range fingerprint.UserIds {
				ret = append(ret, &models.SceneFingerprint{
					SceneID:   sceneID,
					UserID:    userID,
					Hash:      fingerprint.Hash,
					Algorithm: fingerprint.Algorithm.String(),
					Duration:  fingerprint.Duration,
					Vote:      vote,
				})
			}
		}
	}

	return ret
}

func createFingerprints(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, fingerprints []*models.FingerprintEditInput) error {
	var params []db.CreateSceneFingerprintsParams
	user := auth.GetCurrentUser(ctx)

	for _, fp := range fingerprints {
		id, err := getOrCreateFingerprint(ctx, tx, fp.Hash, fp.Algorithm.String())
		if err != nil {
			return err
		}

		// if no user is set, or if the current user does not have the modify
		// role, then set users to the current user
		userIDs := fp.UserIds
		if len(userIDs) == 0 || !auth.IsRole(ctx, models.RoleEnumModify) {
			userIDs = []uuid.UUID{user.ID}
		}

		for _, userID := range userIDs {
			params = append(params, db.CreateSceneFingerprintsParams{
				UserID:        userID,
				SceneID:       sceneID,
				FingerprintID: id,
				Duration:      int32(fp.Duration),
			})
		}
	}
	_, err := tx.CreateSceneFingerprints(ctx, params)
	return err
}

func updateFingerprints(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, userID uuid.UUID, fingerprints []*models.FingerprintEditInput) error {
	if err := tx.DeleteSceneFingerprintsByScene(ctx, sceneID); err != nil {
		return err
	}

	dbFingerprints, err := tx.GetAllSceneFingerprints(ctx, sceneID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return err
	}

	var existingFingerprints []*models.SceneFingerprint
	for _, fp := range dbFingerprints {
		existingFingerprints = append(existingFingerprints, &models.SceneFingerprint{
			SceneID:   sceneID,
			UserID:    fp.UserID,
			Hash:      fp.Hash,
			Algorithm: fp.Algorithm,
			Duration:  int(fp.Duration),
			CreatedAt: fp.CreatedAt.Time,
		})
	}

	user := auth.GetCurrentUser(ctx)
	sceneFingerprints := createUpdatedSceneFingerprints(sceneID, existingFingerprints, fingerprints, user.ID)

	var params []db.CreateSceneFingerprintsParams
	for _, fp := range sceneFingerprints {
		id, err := getOrCreateFingerprint(ctx, tx, fp.Hash, fp.Algorithm)
		if err != nil {
			return err
		}

		params = append(params, db.CreateSceneFingerprintsParams{
			UserID:        fp.UserID,
			SceneID:       sceneID,
			FingerprintID: id,
			Duration:      int32(fp.Duration),
		})
	}
	_, err = tx.CreateSceneFingerprints(ctx, params)
	return err
}

func createPerformers(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, performers []*models.PerformerAppearanceInput) error {
	var params []db.CreateScenePerformersParams
	for _, performer := range performers {
		param := db.CreateScenePerformersParams{
			SceneID:     sceneID,
			PerformerID: performer.PerformerID,
		}
		if performer.As != nil {
			param.As = pgtype.Text{String: *performer.As, Valid: true}
		}

		params = append(params, param)
	}
	_, err := tx.CreateScenePerformers(ctx, params)
	return err
}

func updatePerformers(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, performers []*models.PerformerAppearanceInput) error {
	if err := tx.DeleteScenePerformers(ctx, sceneID); err != nil {
		return err
	}
	return createPerformers(ctx, tx, sceneID, performers)
}

func createURLs(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, urls []*models.URLInput) error {
	var params []db.CreateSceneURLsParams
	for _, url := range urls {
		params = append(params, db.CreateSceneURLsParams{
			SceneID: sceneID,
			Url:     url.URL,
			SiteID:  url.SiteID,
		})
	}
	_, err := tx.CreateSceneURLs(ctx, params)
	return err
}

func updateURLs(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, urls []*models.URLInput) error {
	if err := tx.DeleteSceneURLs(ctx, sceneID); err != nil {
		return err
	}
	return createURLs(ctx, tx, sceneID, urls)
}

func createImages(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, images []uuid.UUID) error {
	var params []db.CreateSceneImagesParams
	for _, image := range images {
		params = append(params, db.CreateSceneImagesParams{
			SceneID: sceneID,
			ImageID: image,
		})
	}

	_, err := tx.CreateSceneImages(ctx, params)
	return err
}

func updateImages(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, images []uuid.UUID) error {
	// TODO Remove unused images
	if err := tx.DeleteSceneImages(ctx, sceneID); err != nil {
		return err
	}
	return createImages(ctx, tx, sceneID, images)
}

func createTags(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, tags []uuid.UUID) error {
	var params []db.CreateSceneTagsParams
	for _, tag := range tags {
		params = append(params, db.CreateSceneTagsParams{
			SceneID: sceneID,
			TagID:   tag,
		})
	}

	_, err := tx.CreateSceneTags(ctx, params)
	return err
}

func updateTags(ctx context.Context, tx *db.Queries, sceneID uuid.UUID, tags []uuid.UUID) error {
	if err := tx.DeleteSceneTagsByScene(ctx, sceneID); err != nil {
		return err
	}
	return createTags(ctx, tx, sceneID, tags)
}

func createUpdatedSceneFingerprints(sceneID uuid.UUID, original []*models.SceneFingerprint, updated []*models.FingerprintEditInput, currentUserID uuid.UUID) []*models.SceneFingerprint {
	var ret []*models.SceneFingerprint

	// hashes present are kept - use existing users
	// hashes missing are destroyed
	for _, o := range original {
		for _, u := range updated {
			if isSameHash(o, u) {
				ret = append(ret, o)
				break
			}
		}
	}

	// new hashes are created and assigned to the current user
	for _, u := range updated {
		found := false
		for _, o := range original {
			if isSameHash(o, u) {
				found = true
				break
			}
		}

		if !found {
			if len(u.UserIds) == 0 {
				u.UserIds = []uuid.UUID{currentUserID}
			}
			if u.Duration > 0 {
				for _, userID := range u.UserIds {
					ret = append(ret, &models.SceneFingerprint{
						SceneID:   sceneID,
						UserID:    userID,
						Hash:      u.Hash,
						Algorithm: u.Algorithm.String(),
						Duration:  u.Duration,
						CreatedAt: u.Created,
					})
				}
			}
		}
	}

	return ret
}

func getOrCreateFingerprint(ctx context.Context, tx *db.Queries, hash string, algorithm string) (int32, error) {
	// Try to get FP
	dbFP, err := tx.GetFingerprint(ctx, db.GetFingerprintParams{
		Hash:      hash,
		Algorithm: algorithm,
	})
	if err != nil {
		// If err, try to create FP instead
		dbFP, err = tx.CreateFingerprint(ctx, db.CreateFingerprintParams{
			Hash:      hash,
			Algorithm: algorithm,
		})
	}

	return dbFP.ID, err
}

func isSameHash(f *models.SceneFingerprint, ff *models.FingerprintEditInput) bool {
	return f.Algorithm == ff.Algorithm.String() && f.Hash == ff.Hash
}

func (s *Scene) FindByIds(ctx context.Context, ids []uuid.UUID) ([]*models.Scene, []error) {
	scenes, err := s.queries.GetScenes(ctx, ids)
	if err != nil {
		return nil, utils.DuplicateError(err, len(ids))
	}

	result := make([]*models.Scene, len(ids))
	sceneMap := make(map[uuid.UUID]*models.Scene)

	for _, scene := range scenes {
		sceneMap[scene.ID] = converter.SceneToModel(scene)
	}

	for i, id := range ids {
		result[i] = sceneMap[id]
	}

	return result, make([]error, len(ids))
}
