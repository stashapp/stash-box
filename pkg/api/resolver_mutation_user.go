package api

import (
	"context"
	"errors"
	"fmt"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/logger"
	"github.com/stashapp/stash-box/pkg/manager"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	if err := user.ValidateCreate(input); err != nil {
		return nil, err
	}

	var u *models.User
	var err error
	fac := r.getRepoFactory(ctx)
	err = fac.WithTxn(func() error {
		u, err = user.Create(fac, input)

		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *mutationResolver) UserUpdate(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	var u *models.User
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.User()
		current, err := qb.Find(input.ID)

		if err != nil {
			return fmt.Errorf("error finding user: %w", err)
		}

		if current == nil {
			return fmt.Errorf("user not found for id %s", input.ID)
		}

		if err := user.ValidateUpdate(input, *current); err != nil {
			return err
		}

		if input.Name != nil && *input.Name != current.Name {
			if err := validateAdmin(ctx); err != nil {
				return fmt.Errorf("must be admin to change user name")
			}
		}

		u, err = user.Update(fac, input)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return u, nil
}

func (r *mutationResolver) UserDestroy(ctx context.Context, input models.UserDestroyInput) (bool, error) {
	fac := r.getRepoFactory(ctx)
	var ret bool
	err := fac.WithTxn(func() error {
		qb := fac.User()
		u, err := qb.Find(input.ID)

		if err != nil {
			return fmt.Errorf("error finding user: %w", err)
		}

		if u == nil {
			return fmt.Errorf("user not found for id %s", input.ID)
		}

		if err = user.ValidateDestroy(u); err != nil {
			return err
		}

		if err := fac.Edit().CancelUserEdits(input.ID); err != nil {
			return err
		}

		ret, err = user.Destroy(fac, input)

		return err
	})

	if err != nil {
		return false, err
	}

	return ret, nil
}

func (r *mutationResolver) RegenerateAPIKey(ctx context.Context, userID *uuid.UUID) (string, error) {
	currentUser := getCurrentUser(ctx)
	if currentUser == nil {
		return "", user.ErrUnauthorized
	}

	if userID != nil {
		if currentUser.ID != *userID {
			// changing another user api key
			// must be admin
			if err := validateAdmin(ctx); err != nil {
				return "", err
			}
		}
	} else {
		// changing current user api key
		userID = &currentUser.ID
	}

	fac := r.getRepoFactory(ctx)
	var ret string
	err := fac.WithTxn(func() error {
		var err error
		ret, err = user.RegenerateAPIKey(fac, *userID)

		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return "", err
	}

	return ret, err
}

func (r *mutationResolver) ResetPassword(ctx context.Context, input models.ResetPasswordInput) (bool, error) {
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		return user.ResetPassword(fac, manager.GetInstance().EmailManager, input.Email)
	})

	if err != nil {
		return false, err
	}

	return true, nil
}

func (r *mutationResolver) ChangePassword(ctx context.Context, input models.UserChangePasswordInput) (bool, error) {
	currentUser := getCurrentUser(ctx)
	fac := r.getRepoFactory(ctx)

	if input.ResetKey != nil {
		err := fac.WithTxn(func() error {
			return user.ActivateResetPassword(fac, *input.ResetKey, input.NewPassword)
		})

		if err != nil {
			return false, err
		}

		return true, nil
	}

	// just setting password
	if currentUser == nil {
		return false, user.ErrUnauthorized
	}

	if input.ExistingPassword == nil {
		return false, user.ErrCurrentPasswordIncorrect
	}

	// changing current user password
	userIDStr := currentUser.ID.String()
	userID := userIDStr

	err := fac.WithTxn(func() error {
		err := user.ChangePassword(fac, userID, *input.ExistingPassword, input.NewPassword)
		if err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return false, err
	}

	return err == nil, err
}

func (r *mutationResolver) NewUser(ctx context.Context, input models.NewUserInput) (*string, error) {
	inviteKey := ""
	if input.InviteKey != nil {
		inviteKey = *input.InviteKey
	}

	fac := r.getRepoFactory(ctx)
	var ret *string
	err := fac.WithTxn(func() error {
		var txnErr error
		ret, txnErr = user.NewUser(fac, manager.GetInstance().EmailManager, input.Email, inviteKey)
		return txnErr
	})

	return ret, err
}

func (r *mutationResolver) ActivateNewUser(ctx context.Context, input models.ActivateNewUserInput) (*models.User, error) {
	var ret *models.User
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		var txnErr error
		ret, txnErr = user.ActivateNewUser(fac, input.Name, input.Email, input.ActivationKey, input.Password)
		return txnErr
	})

	return ret, err
}

func (r *mutationResolver) GenerateInviteCodes(ctx context.Context, input *models.GenerateInviteCodeInput) ([]uuid.UUID, error) {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := validateInvite(ctx); err == nil {
		requireToken = false
	}

	currentUser := getCurrentUser(ctx)
	var ret []uuid.UUID
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		uqb := fac.User()
		ikqb := fac.Invite()

		keys, txnErr := user.GenerateInviteKeys(uqb, ikqb, currentUser.ID, input, requireToken)
		if txnErr != nil {
			return txnErr
		}

		for _, k := range keys {
			ret = append(ret, k.ID)
		}

		// Log the operation
		logger.Userf(currentUser.Name, "GenerateInviteCode", "%s", keys)

		return nil
	})

	return ret, err
}

func (r *mutationResolver) GenerateInviteCode(ctx context.Context) (*uuid.UUID, error) {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := validateInvite(ctx); err == nil {
		requireToken = false
	}

	currentUser := getCurrentUser(ctx)
	var ret *uuid.UUID
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		uqb := fac.User()
		ikqb := fac.Invite()

		keys := 1
		uses := 1
		input := &models.GenerateInviteCodeInput{
			Keys: &keys,
			Uses: &uses,
		}

		key, txnErr := user.GenerateInviteKeys(uqb, ikqb, currentUser.ID, input, requireToken)
		if txnErr != nil {
			return txnErr
		}

		if len(key) == 0 {
			return errors.New("no invite code generated")
		}

		ret = &key[0].ID

		// Log the operation
		logger.Userf(currentUser.Name, "GenerateInviteCode", "%s", ret)

		return nil
	})

	if err != nil {
		return nil, err
	}

	return ret, err
}

func (r *mutationResolver) RescindInviteCode(ctx context.Context, inviteKeyID uuid.UUID) (bool, error) {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := validateInvite(ctx); err == nil {
		requireToken = false
	}

	tokenManagerErr := validateManageInvites(ctx)

	currentUser := getCurrentUser(ctx)
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		uqb := fac.User()
		ikqb := fac.Invite()

		userID := currentUser.ID

		// Non-token managers may only rescind their own invite code
		if tokenManagerErr == nil {
			inviteKey, err := ikqb.Find(inviteKeyID)
			if err != nil {
				return err
			}

			if inviteKey == nil {
				return errors.New("invalid key")
			}

			userID = inviteKey.GeneratedBy
		}

		txnErr := user.RescindInviteKey(uqb, ikqb, inviteKeyID, userID, requireToken)
		if txnErr != nil {
			return txnErr
		}

		// Log the operation
		logger.Userf(currentUser.Name, "RescindInviteCode", "%v", inviteKeyID)

		return nil
	})

	return err == nil, err
}

func (r *mutationResolver) GrantInvite(ctx context.Context, input models.GrantInviteInput) (int, error) {
	if err := validateManageInvites(ctx); err != nil {
		return 0, err
	}

	var ret int
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.User()

		var txnErr error
		ret, txnErr = user.GrantInviteTokens(qb, input.UserID, input.Amount)
		if txnErr != nil {
			return txnErr
		}

		// Log the operation
		currentUser := getCurrentUser(ctx)
		logger.Userf(currentUser.Name, "GrantInvite", "+ %d to %v = %d", input.Amount, input.UserID, ret)

		return nil
	})

	return ret, err
}

func (r *mutationResolver) RevokeInvite(ctx context.Context, input models.RevokeInviteInput) (int, error) {
	if err := validateManageInvites(ctx); err != nil {
		return 0, err
	}

	var ret int
	fac := r.getRepoFactory(ctx)
	err := fac.WithTxn(func() error {
		qb := fac.User()

		var txnErr error
		ret, txnErr = user.RepealInviteTokens(qb, input.UserID, input.Amount)
		if txnErr != nil {
			return txnErr
		}

		// Log the operation
		currentUser := getCurrentUser(ctx)
		logger.Userf(currentUser.Name, "RevokeInvite", "- %d to %v = %d", input.Amount, input.UserID, ret)

		return nil
	})

	return ret, err
}
