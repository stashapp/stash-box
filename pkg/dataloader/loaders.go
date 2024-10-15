package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

type contextKey int

const (
	loadersKey contextKey = iota
)

type Loaders struct {
	SceneFingerprintsByID          FingerprintsLoader
	SubmittedSceneFingerprintsByID FingerprintsLoader
	ImageByID                      ImageLoader
	PerformerByID                  PerformerLoader
	PerformerAliasesByID           StringsLoader
	PerformerImageIDsByID          UUIDsLoader
	PerformerMergeIDsByID          UUIDsLoader
	PerformerPiercingsByID         BodyModificationsLoader
	PerformerTattoosByID           BodyModificationsLoader
	PerformerUrlsByID              URLLoader
	PerformerIsFavoriteByID        BoolsLoader
	SceneImageIDsByID              UUIDsLoader
	SceneAppearancesByID           SceneAppearancesLoader
	SceneUrlsByID                  URLLoader
	StudioImageIDsByID             UUIDsLoader
	StudioIsFavoriteByID           BoolsLoader
	StudioUrlsByID                 URLLoader
	StudioAliasesByID              StringsLoader
	SceneTagIDsByID                UUIDsLoader
	SiteByID                       SiteLoader
	StudioByID                     StudioLoader
	TagByID                        TagLoader
	TagCategoryByID                TagCategoryLoader
}

func Middleware(fac models.Repo) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), loadersKey, GetLoaders(r.Context(), fac))
			r = r.WithContext(ctx)
			next.ServeHTTP(w, r)
		})
	}
}

func For(ctx context.Context) *Loaders {
	return ctx.Value(loadersKey).(*Loaders)
}

func GetLoadersKey() contextKey {
	return loadersKey
}
func GetLoaders(ctx context.Context, fac models.Repo) *Loaders {
	currentUser := user.GetCurrentUser(ctx)

	return &Loaders{
		SceneFingerprintsByID: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				qb := fac.Scene()
				return qb.GetAllFingerprints(currentUser.ID, ids, false)
			},
		},
		SubmittedSceneFingerprintsByID: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				qb := fac.Scene()
				return qb.GetAllFingerprints(currentUser.ID, ids, true)
			},
		},
		PerformerByID: PerformerLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Performer, []error) {
				qb := fac.Performer()
				return qb.FindByIds(ids)
			},
		},
		SceneImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := fac.Image()
				return qb.FindIdsBySceneIds(ids)
			},
		},
		PerformerImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := fac.Image()
				return qb.FindIdsByPerformerIds(ids)
			},
		},
		PerformerMergeIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := fac.Performer()
				return qb.FindMergeIDsByPerformerIDs(ids)
			},
		},
		PerformerAliasesByID: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				qb := fac.Performer()
				return qb.GetAllAliases(ids)
			},
		},
		PerformerTattoosByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := fac.Performer()
				return qb.GetAllTattoos(ids)
			},
		},
		PerformerPiercingsByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				qb := fac.Performer()
				return qb.GetAllPiercings(ids)
			},
		},
		SceneAppearancesByID: SceneAppearancesLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]models.PerformersScenes, []error) {
				qb := fac.Scene()
				return qb.GetAllAppearances(ids)
			},
		},
		SceneUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := fac.Scene()
				return qb.GetAllURLs(ids)
			},
		},
		PerformerUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := fac.Performer()
				return qb.GetAllURLs(ids)
			},
		},
		StudioUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				qb := fac.Studio()
				return qb.GetAllURLs(ids)
			},
		},
		ImageByID: ImageLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Image, []error) {
				qb := fac.Image()
				return qb.FindByIds(ids)
			},
		},
		StudioImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := fac.Image()
				return qb.FindIdsByStudioIds(ids)
			},
		},
		SceneTagIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				qb := fac.Tag()
				return qb.FindIdsBySceneIds(ids)
			},
		},
		SiteByID: SiteLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Site, []error) {
				qb := fac.Site()
				return qb.FindByIds(ids)
			},
		},
		StudioByID: StudioLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Studio, []error) {
				qb := fac.Studio()
				return qb.FindByIds(ids)
			},
		},
		TagByID: TagLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Tag, []error) {
				qb := fac.Tag()
				return qb.FindByIds(ids)
			},
		},
		TagCategoryByID: TagCategoryLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.TagCategory, []error) {
				qb := fac.TagCategory()
				return qb.FindByIds(ids)
			},
		},
		PerformerIsFavoriteByID: BoolsLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]bool, []error) {
				qb := fac.Performer()
				return qb.IsFavoriteByIds(currentUser.ID, ids)
			},
		},
		StudioIsFavoriteByID: BoolsLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]bool, []error) {
				qb := fac.Studio()
				return qb.IsFavoriteByIds(currentUser.ID, ids)
			},
		},
		StudioAliasesByID: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				qb := fac.Studio()
				return qb.GetAllAliases(ids)
			},
		},
	}
}
