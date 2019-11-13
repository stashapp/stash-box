package api

import (
	"context"
	"strconv"
	"time"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) PerformerCreate(ctx context.Context, input models.PerformerCreateInput) (*models.Performer, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	var err error

	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	currentTime := time.Now()
	newPerformer := models.Performer{
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	newPerformer.CopyFromCreateInput(input)

	// Start the transaction and save the performer
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewPerformerQueryBuilder()
	performer, err := qb.Create(newPerformer, tx)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
	if err := qb.CreateAliases(performerAliases, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the URLs
	performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
	if err := qb.CreateUrls(performerUrls, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Tattoos
	performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
	if err := qb.CreateTattoos(performerTattoos, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Piercings
	performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
	if err := qb.CreatePiercings(performerPiercings, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return performer, nil
}

func (r *mutationResolver) PerformerUpdate(ctx context.Context, input models.PerformerUpdateInput) (*models.Performer, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	qb := models.NewPerformerQueryBuilder()

	// get the existing performer and modify it
	performerID, _ := strconv.Atoi(input.ID)
	updatedPerformer, err := qb.Find(performerID)

	if err != nil {
		return nil, err
	}

	updatedPerformer.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Start the transaction and save the performer
	tx := database.DB.MustBeginTx(ctx, nil)

	// Populate performer from the input
	updatedPerformer.CopyFromUpdateInput(input)

	performer, err := qb.Update(*updatedPerformer, tx)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
	if err := qb.UpdateAliases(performer.ID, performerAliases, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the URLs
	performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
	if err := qb.UpdateUrls(performer.ID, performerUrls, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Tattoos
	performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
	if err := qb.UpdateTattoos(performer.ID, performerTattoos, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Piercings
	performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
	if err := qb.UpdatePiercings(performer.ID, performerPiercings, tx); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return performer, nil
}

func (r *mutationResolver) PerformerDestroy(ctx context.Context, input models.PerformerDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	qb := models.NewPerformerQueryBuilder()
	tx := database.DB.MustBeginTx(ctx, nil)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	performerID, err := strconv.ParseInt(input.ID, 10, 64)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(performerID, tx); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
