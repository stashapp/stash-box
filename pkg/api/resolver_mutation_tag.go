package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/models"
)

func (r *mutationResolver) TagCreate(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	currentTime := time.Now()
	newTag := models.Tag{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newTag.CopyFromCreateInput(input)

	// Start the transaction and save the performer
	fac := r.getRepoFactory(ctx)
	var tag *models.Tag
	err = fac.WithTxn(func() error {
		qb := fac.Tag()
		tag, err = qb.Create(newTag)
		if err != nil {
			return err
		}

		// Save the aliases
		tagAliases := models.CreateTagAliases(tag.ID, input.Aliases)
		return qb.CreateAliases(tagAliases)
	})

	if err != nil {
		return nil, err
	}

	return tag, nil
}

func (r *mutationResolver) TagUpdate(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	fac := r.getRepoFactory(ctx)
	var tag *models.Tag
	err := fac.WithTxn(func() error {
		qb := fac.Tag()

		// get the existing tag and modify it
		tagID, _ := uuid.FromString(input.ID)
		updatedTag, err := qb.Find(tagID)

		if err != nil {
			return err
		}

		updatedTag.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

		// Populate performer from the input
		updatedTag.CopyFromUpdateInput(input)

		tag, err = qb.UpdatePartial(*updatedTag)
		if err != nil {
			return err
		}

		// Save the aliases
		// TODO - only do this if provided
		tagAliases := models.CreateTagAliases(tag.ID, input.Aliases)
		return qb.UpdateAliases(tag.ID, tagAliases)
	})

	if err != nil {
		return nil, err
	}

	return tag, nil
}

func (r *mutationResolver) TagDestroy(ctx context.Context, input models.TagDestroyInput) (bool, error) {
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.Tag()

		// references have on delete cascade, so shouldn't be necessary
		// to remove them explicitly

		tagID, err := uuid.FromString(input.ID)
		if err != nil {
			return err
		}
		return qb.Destroy(tagID)
	})

	if err != nil {
		return false, err
	}
	return true, nil
}
