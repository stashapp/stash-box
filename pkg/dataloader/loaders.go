package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stashdb/pkg/models"
)

const loadersKey = "dataloaders"

type Loaders struct {
	SceneFingerprintsById  FingerprintsLoader
	ImageById              ImageLoader
	PerformerById          PerformerLoader
	PerformerAliasesById   StringsLoader
	PerformerImageIDsById  UUIDsLoader
	PerformerPiercingsById BodyModificationsLoader
	PerformerTattoosById   BodyModificationsLoader
	PerformerUrlsById      URLLoader
	SceneImageIDsById      UUIDsLoader
	SceneAppearancesById   SceneAppearancesLoader
	SceneUrlsById          URLLoader
	StudioImageIDsById     UUIDsLoader
	StudioUrlsById         URLLoader
	SceneTagIDsById        UUIDsLoader
	TagById                TagLoader
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

func GetLoadersKey() string {
	return loadersKey
}
func GetLoaders() *Loaders {
	return &Loaders{
		SceneFingerprintsById: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllFingerprints(ids)
			},
		},
		PerformerById: PerformerLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Performer, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
		SceneImageIDsById: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsBySceneIds(ids)
			},
		},
		PerformerImageIDsById: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsByPerformerIds(ids)
			},
		},
		PerformerAliasesById: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllAliases(ids)
			},
		},
		PerformerTattoosById: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllTattoos(ids)
			},
		},
		PerformerPiercingsById: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllPiercings(ids)
			},
		},
		SceneAppearancesById: SceneAppearancesLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]models.PerformersScenes, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllAppearances(ids)
			},
		},
		SceneUrlsById: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewSceneQueryBuilder(nil)
				return qb.GetAllUrls(ids)
			},
		},
		PerformerUrlsById: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewPerformerQueryBuilder(nil)
				return qb.GetAllUrls(ids)
			},
		},
		StudioUrlsById: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := models.NewStudioQueryBuilder(nil)
				return qb.GetAllUrls(ids)
			},
		},
		ImageById: ImageLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Image, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
		StudioImageIDsById: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewImageQueryBuilder(nil)
				return qb.FindIdsByStudioIds(ids)
			},
		},
		SceneTagIDsById: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := models.NewTagQueryBuilder(nil)
				return qb.FindIdsBySceneIds(ids)
			},
		},
		TagById: TagLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Tag, []error) {
				qb := models.NewTagQueryBuilder(nil)
				return qb.FindByIds(ids)
			},
		},
	}
}
