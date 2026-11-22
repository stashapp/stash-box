package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

func (r *queryResolver) FindGallery(ctx context.Context, id uuid.UUID) (*models.Gallery, error) {
	return r.services.Gallery().FindByID(ctx, id)
}

func (r *queryResolver) FindGalleries(ctx context.Context, ids []uuid.UUID) ([]*models.Gallery, error) {
	if len(ids) > maxBulkFindIDs {
		return nil, fmt.Errorf("too many ids: %d, maximum is %d", len(ids), maxBulkFindIDs)
	}
	loaded, errs := r.services.Gallery().LoadIDs(ctx, ids)
	for _, err := range errs {
		if err != nil {
			return nil, err
		}
	}
	return loaded, nil
}

func (r *queryResolver) QueryGalleries(ctx context.Context, input models.GalleryQueryInput) (*models.GalleryQuery, error) {
	return &models.GalleryQuery{Filter: input}, nil
}

type queryGalleryResolver struct{ *Resolver }

func (r *queryGalleryResolver) Count(ctx context.Context, obj *models.GalleryQuery) (int, error) {
	if obj.SearchResults != nil {
		return obj.SearchResults.Count, nil
	}
	return r.services.Gallery().QueryCountForPerformer(ctx, obj.Filter, obj.PerformerID)
}

func (r *queryGalleryResolver) Galleries(ctx context.Context, obj *models.GalleryQuery) ([]models.Gallery, error) {
	if obj.SearchResults != nil {
		return obj.SearchResults.Galleries, nil
	}
	return r.services.Gallery().QueryForPerformer(ctx, obj.Filter, obj.PerformerID)
}

func (r *queryResolver) SearchGalleries(ctx context.Context, term string, limit, page, perPage *int) (*models.GalleryQuery, error) {
	searchLimit, offset := 10, 0
	if perPage != nil && *perPage > 0 {
		searchLimit = *perPage
	} else if limit != nil && *limit > 0 {
		searchLimit = *limit
	}
	if page != nil && *page > 1 {
		offset = (*page - 1) * searchLimit
	}
	return r.services.Gallery().Search(ctx, term, searchLimit, offset)
}

func (r *queryResolver) FindGalleriesByFingerprints(ctx context.Context, input models.FindGalleriesByFingerprintsInput) ([]models.GalleryFingerprintMatch, error) {
	const maxGalleryPHashes = 20
	if len(input.Phashes) > maxGalleryPHashes {
		return nil, fmt.Errorf("maximum of %d gallery pHashes allowed per lookup", maxGalleryPHashes)
	}
	matches, err := r.services.Gallery().FindByPHash(ctx, input.Phashes, input.MinimumMatchCount)
	result := make([]models.GalleryFingerprintMatch, len(matches))
	for i := range matches {
		result[i] = models.GalleryFingerprintMatch{
			Gallery:    &matches[i].Gallery,
			MatchCount: matches[i].Count,
		}
	}
	return result, err
}
