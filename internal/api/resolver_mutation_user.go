package api

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

func (r *mutationResolver) UserCreate(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	return r.services.User().Create(ctx, input)
}

func (r *mutationResolver) UserUpdate(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	return r.services.User().Update(ctx, input)
}

func (r *mutationResolver) UserDestroy(ctx context.Context, input models.UserDestroyInput) (bool, error) {
	err := r.services.User().Delete(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) RegenerateAPIKey(ctx context.Context, userID *uuid.UUID) (string, error) {
	return r.services.User().RegenerateAPIKey(ctx, userID)
}

func (r *mutationResolver) ResetPassword(ctx context.Context, input models.ResetPasswordInput) (bool, error) {
	err := r.services.User().ResetPassword(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) ChangePassword(ctx context.Context, input models.UserChangePasswordInput) (bool, error) {
	err := r.services.User().ChangePassword(ctx, input)
	return err == nil, err
}

func (r *mutationResolver) NewUser(ctx context.Context, input models.NewUserInput) (*uuid.UUID, error) {
	return r.services.User().NewUser(ctx, input.Email, input.InviteKey)
}

func (r *mutationResolver) ActivateNewUser(ctx context.Context, input models.ActivateNewUserInput) (*models.User, error) {
	return r.services.User().ActivateNewUser(ctx, input)
}

func (r *mutationResolver) GenerateInviteCodes(ctx context.Context, input *models.GenerateInviteCodeInput) ([]uuid.UUID, error) {
	return r.services.User().GenerateInviteCodes(ctx, input)
}

func (r *mutationResolver) GenerateInviteCode(ctx context.Context) (*uuid.UUID, error) {
	return r.services.User().GenerateInviteCode(ctx)
}

func (r *mutationResolver) RescindInviteCode(ctx context.Context, inviteKeyID uuid.UUID) (bool, error) {
	err := r.services.User().RescindInviteCode(ctx, inviteKeyID)
	return err == nil, err
}

func (r *mutationResolver) GrantInvite(ctx context.Context, input models.GrantInviteInput) (int, error) {
	return r.services.User().GrantInvite(ctx, input)
}

func (r *mutationResolver) RevokeInvite(ctx context.Context, input models.RevokeInviteInput) (int, error) {
	return r.services.User().RevokeInvite(ctx, input)
}

func (r *mutationResolver) RequestChangeEmail(ctx context.Context) (models.UserChangeEmailStatus, error) {
	return r.services.User().RequestChangeEmail(ctx)
}

func (r *mutationResolver) ValidateChangeEmail(ctx context.Context, tokenID uuid.UUID, email string) (models.UserChangeEmailStatus, error) {
	return r.services.User().ValidateChangeEmail(ctx, tokenID, email)
}

func (r *mutationResolver) ConfirmChangeEmail(ctx context.Context, tokenID uuid.UUID) (models.UserChangeEmailStatus, error) {
	return r.services.User().ConfirmChangeEmail(ctx, tokenID)
}
