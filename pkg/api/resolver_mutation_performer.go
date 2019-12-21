package api

import (
	"context"
	"fmt"
	"github.com/gofrs/uuid"
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

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new performer from the input
	currentTime := time.Now()
	newPerformer := models.Performer{
		ID:        UUID,
		CreatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt: models.SQLiteTimestamp{Timestamp: currentTime},
	}

	err = newPerformer.CopyFromCreateInput(input)
	if err != nil {
		return nil, err
	}

	// Start the transaction and save the performer
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewPerformerQueryBuilder(tx)
	performer, err := qb.Create(newPerformer)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
	if err := qb.CreateAliases(performerAliases); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the URLs
	performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
	if err := qb.CreateUrls(performerUrls); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Tattoos
	performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
	if err := qb.CreateTattoos(performerTattoos); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Piercings
	performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
	if err := qb.CreatePiercings(performerPiercings); err != nil {
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

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewPerformerQueryBuilder(tx)

	// get the existing performer and modify it
	performerID, _ := uuid.FromString(input.ID)
	updatedPerformer, err := qb.Find(performerID)

	if err != nil {
		return nil, err
	}

	if updatedPerformer == nil {
		return nil, fmt.Errorf("Performer with id %d cannot be found", performerID)
	}

	updatedPerformer.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate performer from the input
	err = updatedPerformer.CopyFromUpdateInput(input)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	performer, err := qb.Update(*updatedPerformer)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the aliases
	performerAliases := models.CreatePerformerAliases(performer.ID, input.Aliases)
	if err := qb.UpdateAliases(performer.ID, performerAliases); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the URLs
	performerUrls := models.CreatePerformerUrls(performer.ID, input.Urls)
	if err := qb.UpdateUrls(performer.ID, performerUrls); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Tattoos
	performerTattoos := models.CreatePerformerBodyMods(performer.ID, input.Tattoos)
	if err := qb.UpdateTattoos(performer.ID, performerTattoos); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the Piercings
	performerPiercings := models.CreatePerformerBodyMods(performer.ID, input.Piercings)
	if err := qb.UpdatePiercings(performer.ID, performerPiercings); err != nil {
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

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewPerformerQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	performerID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(performerID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
