package usertoken

import (
	"context"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/models"
)

// UserToken handles user token related operations
type UserToken struct {
	queries *db.Queries
	withTxn db.WithTxnFunc
}

// NewUserToken creates a new user token service
func NewUserToken(queries *db.Queries, withTxn db.WithTxnFunc) *UserToken {
	return &UserToken{
		queries: queries,
		withTxn: withTxn,
	}
}

// WithTxn executes a function within a transaction
func (s *UserToken) WithTxn(fn func(*db.Queries) error) error {
	return s.withTxn(fn)
}

// Create creates a new user token
func (s *UserToken) Create(ctx context.Context, newToken models.UserToken) (*models.UserToken, error) {
	// Convert GraphQL model to sqlc parameters
	params := db.CreateUserTokenParams{
		ID:        newToken.ID,
		Type:      newToken.Type,
		CreatedAt: newToken.CreatedAt,
		ExpiresAt: newToken.ExpiresAt,
	}

	// Convert the JSON data
	if len(newToken.Data) > 0 {
		params.Data = []byte(newToken.Data)
	}

	createdToken, err := s.queries.CreateUserToken(ctx, params)
	if err != nil {
		return nil, err
	}

	return converter.UserTokenToModelPtr(createdToken), nil
}

// Destroy deletes a user token by ID
func (s *UserToken) Destroy(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeleteUserToken(ctx, id)
}

// DestroyExpired deletes all expired user tokens
func (s *UserToken) DestroyExpired(ctx context.Context) error {
	return s.queries.DeleteExpiredUserTokens(ctx)
}

// Find finds a user token by ID
func (s *UserToken) Find(ctx context.Context, id uuid.UUID) (*models.UserToken, error) {
	token, err := s.queries.FindUserToken(ctx, id)
	if err != nil {
		return nil, err
	}

	return converter.UserTokenToModelPtr(token), nil
}

// FindByInviteKey finds user tokens by invite key in JSON data
func (s *UserToken) FindByInviteKey(ctx context.Context, key uuid.UUID) ([]*models.UserToken, error) {
	tokens, err := s.queries.FindUserTokensByInviteKey(ctx, key)
	if err != nil {
		return nil, err
	}

	var result []*models.UserToken
	for _, token := range tokens {
		result = append(result, converter.UserTokenToModelPtr(token))
	}

	return result, nil
}

// FindActiveInviteKeysForUser returns active invite keys for a specific user
func (s *UserToken) FindActiveInviteKeysForUser(ctx context.Context, userID uuid.UUID) ([]models.InviteKey, error) {
	keys, err := s.queries.FindActiveInviteKeysForUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	var result []models.InviteKey
	for _, key := range keys {
		result = append(result, converter.InviteKeyToModel(key))
	}

	return result, nil
}
