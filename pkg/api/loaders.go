package api

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/dataloader"
	"github.com/stashapp/stash-box/pkg/models"
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

	var tags []models.Tag
	for _, tag := range ret {
		if tag != nil {
			tags = append(tags, *tag)
		}
	}

	return tags, nil
}

func imageList(ctx context.Context, imageIDs []uuid.UUID) ([]models.Image, error) {
	if len(imageIDs) == 0 {
		return nil, nil
	}

	res, errors := dataloader.For(ctx).ImageByID.LoadAll(imageIDs)
	for _, err := range errors {
		if err != nil {
			return nil, err
		}
	}
	var images []models.Image
	for _, image := range res {
		if image != nil {
			images = append(images, *image)
		}
	}
	return images, nil
}
