package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

type contextKey int

const (
	loadersKey contextKey = iota
)

type Loaders struct {
	SceneFingerprintsByID  FingerprintsLoader
	ImageByID              ImageLoader
	PerformerByID          PerformerLoader
	PerformerAliasesByID   StringsLoader
	PerformerImageIDsByID  UUIDsLoader
	PerformerMergeIDsByID  UUIDsLoader
	PerformerPiercingsByID BodyModificationsLoader
	PerformerTattoosByID   BodyModificationsLoader
	PerformerUrlsByID      URLLoader
	SceneImageIDsByID      UUIDsLoader
	SceneAppearancesByID   SceneAppearancesLoader
	SceneUrlsByID          URLLoader
	StudioImageIDsByID     UUIDsLoader
	StudioUrlsByID         URLLoader
	SceneTagIDsByID        UUIDsLoader
	TagByID                TagLoader
	TagCategoryByID        TagCategoryLoader
}

func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), loadersKey, GetLoaders())
		r = r.WithContext(ctx)
		next.ServeHTTP(w, r)
	})
}

func For(ctx context.Context) *Loaders {
	return ctx.Value(loadersKey).(*Loaders)
}

func GetLoadersKey() contextKey {
	return loadersKey
}
func GetLoaders() *Loaders {
	return &Loaders{
		SceneFingerprintsByID: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllFingerprints(ids)
			},
		},
		PerformerByID: PerformerLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Performer, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
		SceneImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsBySceneIds(ids)
			},
		},
		PerformerImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsByPerformerIds(ids)
			},
		},
		PerformerMergeIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.FindMergeIDsByPerformerIDs(ids)
			},
		},
		PerformerAliasesByID: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllAliases(ids)
			},
		},
		PerformerTattoosByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllTattoos(ids)
			},
		},
		PerformerPiercingsByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllPiercings(ids)
			},
		},
		SceneAppearancesByID: SceneAppearancesLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]models.PerformersScenes, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllAppearances(ids)
			},
		},
		SceneUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllURLs(ids)
			},
		},
		PerformerUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllURLs(ids)
			},
		},
		StudioUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewStudioQueryBuilder(nil)
				return qb.GetAllURLs(ids)
			},
		},
		ImageByID: ImageLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Image, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
		StudioImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsByStudioIds(ids)
			},
		},
		SceneTagIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewTagQueryBuilder(nil)
				return qb.FindIdsBySceneIds(ids)
			},
		},
		TagByID: TagLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Tag, []error) {
				qb := models.NewTagQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
		TagCategoryByID: TagCategoryLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.TagCategory, []error) {
				qb := models.NewTagCategoryQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
	}
}
