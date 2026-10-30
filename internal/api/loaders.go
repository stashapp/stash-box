package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/dataloader"
	"github.com/stashapp/stash-box/internal/models"
)

func tagList(ctx context.Context, tagIDs []uuid.UUID) ([]models.Tag, error) {
	if len(tagIDs) == 0 {
		return nil, nil
	}

	ret, errors := dataloader.For(ctx).TagByID.LoadAll(tagIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}

	return pruneNils(ret), nil
}

func imageList(ctx context.Context, imageIDs []uuid.UUID) ([]*models.Image, error) {
	if len(imageIDs) == 0 {
		return nil, nil
	}

	res, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	return res, nil
}

// maxBulkFindIDs is the maximum number of ids accepted by the bulk find queries.
const maxBulkFindIDs = 100

// loadByIDs resolves a list of ids using a dataloader, returning the results in
// the same order as the ids, with nil in the place of any id that was not found.
func loadByIDs[T any](ids []uuid.UUID, loadAll func([]uuid.UUID) ([]*T, []error)) ([]*T, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	if len(ids) > maxBulkFindIDs {
		return nil, fmt.Errorf("too many ids: %d, maximum is %d", len(ids), maxBulkFindIDs)
	}

	result, errors := loadAll(ids)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

// pruneNils converts a slice of pointers into a slice of values, dropping nil
// entries (items that no longer exist). Returns nil if there are none.
func pruneNils[T any](items []*T) []T {
	var ret []T
	for _, item := range items {
		if item != nil {
			ret = append(ret, *item)
		}
	}
	return ret
}
