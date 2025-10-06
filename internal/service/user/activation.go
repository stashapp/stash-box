package user

import (
	"context"
	"errors"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

var ErrInvalidActivationKey = errors.New("invalid activation key")

func generateActivationKey(ctx context.Context, tx *db.Queries, emailAddr string, inviteKey *uuid.UUID) (db.UserToken, error) {
	data := models.NewUserTokenData{
		Email:     emailAddr,
		InviteKey: inviteKey,
	}
	param, err := converter.CreateUserTokenParamsFromData(models.UserTokenTypeNewUser, data)
	if err != nil {
		return db.UserToken{}, err
	}

	return tx.CreateUserToken(ctx, param)
}

func generateResetPasswordActivationKey(ctx context.Context, tx *db.Queries, userID uuid.UUID) (*uuid.UUID, error) {
	data := models.UserTokenData{
		UserID: userID,
	}

	param, err := converter.CreateUserTokenParamsFromData(models.UserTokenTypeResetPassword, data)
	if err != nil {
		return nil, err
	}

	obj, err := tx.CreateUserToken(ctx, param)
	if err != nil {
		return nil, err
	}

	return &obj.ID, nil
}

func activateResetPassword(ctx context.Context, tx *db.Queries, id uuid.UUID, newPassword string) error {
	token, err := tx.FindUserToken(ctx, id)
	if err != nil {
		return err
	}

	if token.Type != models.UserTokenTypeResetPassword {
		return ErrInvalidActivationKey
	}

	var data models.UserTokenData
	err = utils.FromJSON(token.Data, &data)
	if err != nil {
		return err
	}

	user, err := tx.FindUser(ctx, data.UserID)
	if err != nil {
		return err
	}

	err = validatePassword(user.Name, user.Email, newPassword)
	if err != nil {
		return err
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}

	if err := tx.UpdateUserPassword(ctx, db.UpdateUserPasswordParams{
		ID:           user.ID,
		PasswordHash: hash,
	}); err != nil {
		return err
	}

	return tx.DeleteUserToken(ctx, id)
}
