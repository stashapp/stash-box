package api

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/logger"
	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/user"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	if err := validateAdmin(ctx); err != nil {
		return nil, err
	}

	if err := user.ValidateCreate(input); err != nil {
		return nil, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)

	u, err := user.Create(tx, input)

	if err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	// Commit
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return u, nil
}

func (r *mutationResolver) UserUpdate(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	if err := validateAdmin(ctx); err != nil {
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

	if err := user.ValidateUpdate(input, *current); err != nil {
		_ = tx.Rollback()
		return nil, err
	}

	user, err := user.Update(tx, input)
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
	if err := validateAdmin(ctx); err != nil {
		return false, err
	}

	tx := database.DB.MustBeginTx(ctx, nil)

	qb := models.NewUserQueryBuilder(tx)
	userID, _ := uuid.FromString(input.ID)
	u, err := qb.Find(userID)

	if err != nil {
		return false, fmt.Errorf("error finding user: %s", err.Error())
	}

	if u == nil {
		return false, fmt.Errorf("user not found for id %s", input.ID)
	}

	if err = user.ValidateDestroy(u); err != nil {
		_ = tx.Rollback()
		return false, err
	}

	ret, err := user.Destroy(tx, input)

	if err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return ret, nil
}

func (r *mutationResolver) RegenerateAPIKey(ctx context.Context, userID *string) (string, error) {
	currentUser := getCurrentUser(ctx)
	if currentUser == nil {
		return "", ErrUnauthorized
	}

	if userID != nil {
		if currentUser.ID.String() != *userID {
			// changing another user api key
			// must be admin
			if err := validateAdmin(ctx); err != nil {
				return "", err
			}
		}
	} else {
		// changing current user api key
		userIDStr := currentUser.ID.String()
		userID = &userIDStr
	}

	tx := database.DB.MustBeginTx(ctx, nil)

	ret, err := user.RegenerateAPIKey(tx, *userID)

	if err != nil {
		_ = tx.Rollback()
		return "", err
	}

	if err := tx.Commit(); err != nil {
		return "", err
	}

	return ret, err
}

func (r *mutationResolver) ResetPassword(ctx context.Context, input models.ResetPasswordInput) (bool, error) {
	panic("not implemented")
}

func (r *mutationResolver) ChangePassword(ctx context.Context, input models.UserChangePasswordInput) (bool, error) {
	currentUser := getCurrentUser(ctx)
	if currentUser == nil {
		return false, ErrUnauthorized
	}

	// changing current user password
	userIDStr := currentUser.ID.String()
	userID := userIDStr

	tx := database.DB.MustBeginTx(ctx, nil)

	// TODO - handle password reset

	err := user.ChangePassword(tx, userID, *input.ExistingPassword, input.NewPassword)
	if err != nil {
		_ = tx.Rollback()
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) NewUser(ctx context.Context, input models.NewUserInput) (bool, error) {
	panic("not implemented")
}

func (r *mutationResolver) ActivateNewUser(ctx context.Context, input models.ActivateNewUserInput) (*models.User, error) {
	panic("not implemented")
}

func (r *mutationResolver) GenerateInviteCode(ctx context.Context) (string, error) {
	panic("not implemented")
}

func (r *mutationResolver) RescindInviteCode(ctx context.Context, code string) (bool, error) {
	panic("not implemented")
}

func (r *mutationResolver) GrantInvite(ctx context.Context, input models.GrantInviteInput) (int, error) {
	if err := validateManageInvites(ctx); err != nil {
		return 0, err
	}

	currentUser := getCurrentUser(ctx)
	var ret int
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewUserQueryBuilder(txn.GetTx())
		userID, _ := uuid.FromString(input.UserID)

		var txnErr error
		ret, txnErr = user.GrantInviteTokens(&qb, userID, input.Amount)
		if txnErr != nil {
			return txnErr
		}

		// log the operation
		logger.Userf(currentUser.Name, "GrantInvite", "+ %d to %s = %d", input.Amount, userID.String(), ret)

		return nil
	})

	if err != nil {
		return 0, err
	}

	return ret, nil
}

func (r *mutationResolver) RepealInvite(ctx context.Context, input models.RescindInviteInput) (int, error) {
	if err := validateManageInvites(ctx); err != nil {
		return 0, err
	}

	currentUser := getCurrentUser(ctx)
	var ret int
	err := database.WithTransaction(ctx, func(txn database.Transaction) error {
		qb := models.NewUserQueryBuilder(txn.GetTx())
		userID, _ := uuid.FromString(input.UserID)

		var txnErr error
		ret, txnErr = user.RepealInviteTokens(&qb, userID, input.Amount)
		if txnErr != nil {
			return txnErr
		}

		// log the operation
		logger.Userf(currentUser.Name, "RepealInvite", "- %d to %s = %d", input.Amount, userID.String(), ret)

		return nil
	})

	if err != nil {
		return 0, err
	}

	return ret, nil
}
