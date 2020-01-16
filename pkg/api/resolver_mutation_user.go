package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/manager"
	"github.com/stashapp/stashdb/pkg/models"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	if err := validateModify(ctx); err != nil {
		return nil, err
	}

	if err := manager.ValidateUserCreate(input); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)

	user, err := manager.UserCreate(tx, input)

	if err != nil {
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
	userID, _ := uuid.FromString(input.ID)
	current, err := qb.Find(userID)

	if err != nil {
		return nil, fmt.Errorf("error finding user: %s", err.Error())
	}

	if current == nil {
		return nil, fmt.Errorf("user not found for id %s", input.ID)
	}

	if err := manager.ValidateUserUpdate(input, *current); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	user, err := manager.UserUpdate(tx, input)
	if err != nil {
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
	userID, _ := uuid.FromString(input.ID)
	user, err := qb.Find(userID)

	if err != nil {
		return false, fmt.Errorf("error finding user: %s", err.Error())
	}

	if user == nil {
		return false, fmt.Errorf("user not found for id %s", input.ID)
	}

	if err = manager.ValidateDestroyUser(user); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	ret, err := manager.UserDestroy(tx, input)

	if err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return ret, nil
}
