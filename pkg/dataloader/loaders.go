package dataloader

import (
	"context"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/service"
	"github.com/stashapp/stash-box/pkg/models"
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
	PerformerMergeIDsBySourceID    UUIDsLoader
	PerformerPiercingsByID         BodyModificationsLoader
	PerformerTattoosByID           BodyModificationsLoader
	PerformerUrlsByID              URLLoader
	PerformerIsFavoriteByID        BoolsLoader
	SceneByID                      SceneLoader
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
	EditByID                       EditLoader
	EditCommentByID                EditCommentLoader
}

func Middleware(fac service.Factory) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			ctx = context.WithValue(ctx, loadersKey, GetLoaders(r.Context(), fac))
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
func GetLoaders(ctx context.Context, fac service.Factory) *Loaders {
	currentUser := auth.GetCurrentUser(ctx)

	return &Loaders{
		SceneFingerprintsByID: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				s := fac.Scene()
				return s.GetAllFingerprints(ctx, currentUser.ID, ids, false)
			},
		},
		SubmittedSceneFingerprintsByID: FingerprintsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.Fingerprint, []error) {
				s := fac.Scene()
				return s.GetAllFingerprints(ctx, currentUser.ID, ids, true)
			},
		},
		PerformerByID: PerformerLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Performer, []error) {
				s := fac.Performer()
				return s.FindByIds(ctx, ids)
			},
		},
		SceneImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Image()
				return s.FindIdsBySceneIds(ctx, ids)
			},
		},
		PerformerImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Image()
				return s.FindIdsByPerformerIds(ctx, ids)
			},
		},
		PerformerMergeIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Performer()
				return s.FindMergeIDsByPerformerIDs(ctx, ids)
			},
		},
		PerformerMergeIDsBySourceID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Performer()
				return s.FindMergeIDsBySourcePerformerIDs(ctx, ids)
			},
		},
		PerformerAliasesByID: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				s := fac.Performer()
				return s.GetAllAliases(ctx, ids)
			},
		},
		PerformerTattoosByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				s := fac.Performer()
				return s.GetAllTattoos(ctx, ids)
			},
		},
		PerformerPiercingsByID: BodyModificationsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.BodyModification, []error) {
				s := fac.Performer()
				return s.GetAllPiercings(ctx, ids)
			},
		},
		SceneAppearancesByID: SceneAppearancesLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.PerformerScene, []error) {
				s := fac.Scene()
				return s.GetAllAppearances(ctx, ids)
			},
		},
		SceneUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				s := fac.Scene()
				return s.GetAllURLs(ctx, ids)
			},
		},
		PerformerUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				s := fac.Performer()
				return s.GetAllURLs(ctx, ids)
			},
		},
		StudioUrlsByID: URLLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]*models.URL, []error) {
				s := fac.Studio()
				return s.GetAllURLs(ctx, ids)
			},
		},
		ImageByID: ImageLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Image, []error) {
				s := fac.Image()
				return s.FindByIds(ctx, ids)
			},
		},
		StudioImageIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Image()
				return s.FindIdsByStudioIds(ctx, ids)
			},
		},
		SceneTagIDsByID: UUIDsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]uuid.UUID, []error) {
				s := fac.Tag()
				return s.FindIdsBySceneIds(ctx, ids)
			},
		},
		SiteByID: SiteLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Site, []error) {
				s := fac.Site()
				return s.FindByIds(ctx, ids)
			},
		},
		StudioByID: StudioLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Studio, []error) {
				s := fac.Studio()
				return s.FindByIds(ctx, ids)
			},
		},
		TagByID: TagLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Tag, []error) {
				s := fac.Tag()
				return s.FindByIds(ctx, ids)
			},
		},
		TagCategoryByID: TagCategoryLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.TagCategory, []error) {
				s := fac.Tag()
				return s.FindCategoriesByIds(ctx, ids)
			},
		},
		EditByID: EditLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Edit, []error) {
				s := fac.Edit()
				return s.FindByIds(ctx, ids)
			},
		},
		EditCommentByID: EditCommentLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.EditComment, []error) {
				s := fac.Edit()
				return s.FindCommentsByIds(ctx, ids)
			},
		},
		SceneByID: SceneLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]*models.Scene, []error) {
				s := fac.Scene()
				return s.FindByIds(ctx, ids)
			},
		},
		PerformerIsFavoriteByID: BoolsLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]bool, []error) {
				s := fac.Performer()
				return s.IsFavoriteByIds(ctx, currentUser.ID, ids)
			},
		},
		StudioIsFavoriteByID: BoolsLoader{
			maxBatch: 1000,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([]bool, []error) {
				s := fac.Studio()
				return s.IsFavoriteByIds(ctx, currentUser.ID, ids)
			},
		},
		StudioAliasesByID: StringsLoader{
			maxBatch: 100,
			wait:     1 * time.Millisecond,
			fetch: func(ids []uuid.UUID) ([][]string, []error) {
				s := fac.Studio()
				return s.GetAllAliases(ctx, ids)
			},
		},
	}
}
