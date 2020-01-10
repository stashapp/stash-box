package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
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

	// Populate a new studio from the input
	currentTime := time.Now()
	newUser := models.User{
		ID: UUID,
		// set last API call to now just so that it has a value
		LastAPICall: models.SQLiteTimestamp{Timestamp: currentTime},
		CreatedAt:   models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt:   models.SQLiteTimestamp{Timestamp: currentTime},
	}

	err = newUser.CopyFromCreateInput(input)
	if err != nil {
		return nil, err
	}

	// Start the transaction and save the user
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewUserQueryBuilder(tx)
	user, err := qb.Create(newUser)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the roles
	userRoles := models.CreateUserRoles(user.ID, input.Roles)
	if err := qb.CreateRoles(userRoles); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return user, nil
}
func (r *mutationResolver) UserUpdate(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewUserQueryBuilder(tx)

	// get the existing studio and modify it
	userID, _ := uuid.FromString(input.ID)
	updatedUser, err := qb.Find(userID)

	if err != nil {
		return nil, err
	}

	updatedUser.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate studio from the input
	err = updatedUser.CopyFromUpdateInput(input)
	if err != nil {
		return nil, err
	}

	user, err := qb.Update(*updatedUser)
	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Save the roles
	// TODO - only do this if provided
	userRoles := models.CreateUserRoles(user.ID, input.Roles)
	if err := qb.UpdateRoles(user.ID, userRoles); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return user, nil
}
func (r *mutationResolver) UserDestroy(ctx context.Context, input models.UserDestroyInput) (bool, error) {
	if err := validateModify(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewUserQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	userID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(userID); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	return true, nil
}
