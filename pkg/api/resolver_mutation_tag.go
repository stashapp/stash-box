package api

import (
	"context"
	"strconv"
	"time"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) TagCreate(ctx context.Context, input models.TagCreateInput) (*models.Tag, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var err error

	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	currentTime := time.Now()
	newTag := models.Tag{
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newTag.CopyFromCreateInput(input)

	// Start the transaction and save the performer
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewTagQueryBuilder(tx)
	tag, err := qb.Create(newTag)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	tagAliases := models.CreateTagAliases(tag.ID, input.Aliases)
	if err := qb.CreateAliases(tagAliases); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return tag, nil
}

func (r *mutationResolver) TagUpdate(ctx context.Context, input models.TagUpdateInput) (*models.Tag, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewTagQueryBuilder(tx)

	// get the existing tag and modify it
	tagID, _ := strconv.ParseInt(input.ID, 10, 64)
	updatedTag, err := qb.Find(tagID)

	if err != nil {
		return nil, err
	}

	updatedTag.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate performer from the input
	updatedTag.CopyFromUpdateInput(input)

	tag, err := qb.Update(*updatedTag)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	// TODO - only do this if provided
	tagAliases := models.CreateTagAliases(tag.ID, input.Aliases)
	if err := qb.UpdateAliases(tag.ID, tagAliases); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return tag, nil
}

func (r *mutationResolver) TagDestroy(ctx context.Context, input models.TagDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewTagQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	tagID, err := strconv.ParseInt(input.ID, 10, 64)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(tagID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
