package user

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/email"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
	"github.com/stashapp/stash-box/internal/service/errutil"
	"github.com/stashapp/stash-box/pkg/utils"
)

// User handles user-related operations
type User struct {
	queries  *queries.Queries
	withTxn  queries.WithTxnFunc
	emailMgr *email.Manager
}

// NewUser creates a new user service
func NewUser(queries *queries.Queries, withTxn queries.WithTxnFunc, emailMgr *email.Manager) *User {
	return &User{
		queries:  queries,
		withTxn:  withTxn,
		emailMgr: emailMgr,
	}
}

// WithTxn executes a function within a transaction
func (s *User) WithTxn(fn func(*queries.Queries) error) error {
	return s.withTxn(fn)
}

// Queries

func (s *User) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.queries.FindUser(ctx, id)
	if err != nil {
		return nil, errutil.IgnoreNotFound(err)
	}

	return converter.UserToModelPtr(user), nil
}

func (s *User) FindByName(ctx context.Context, name string) (*models.User, error) {
	user, err := s.queries.FindUserByName(ctx, strings.ToUpper(name))
	return converter.UserToModelPtr(user), err
}

func (s *User) Count(ctx context.Context) (int, error) {
	count, err := s.queries.CountUsers(ctx)
	return int(count), err
}

func (s *User) CountVotesByType(ctx context.Context, userID uuid.UUID) (*models.UserVoteCount, error) {
	rows, err := s.queries.CountVotesByType(ctx, userID)
	if err != nil {
		return nil, err
	}

	var result models.UserVoteCount
	for _, row := range rows {
		count := int(row.Count)

		switch row.Vote {
		case "ACCEPT":
			result.Accept = count
		case "REJECT":
			result.Reject = count
		case "ABSTAIN":
			result.Abstain = count
		case "IMMEDIATE_ACCEPT":
			result.ImmediateAccept = count
		case "IMMEDIATE_REJECT":
			result.ImmediateReject = count
		}
	}

	return &result, nil
}

func (s *User) CountEditsByStatus(ctx context.Context, userID uuid.UUID) (*models.UserEditCount, error) {
	rows, err := s.queries.CountUserEditsByStatus(ctx, uuid.NullUUID{UUID: userID, Valid: true})
	if err != nil {
		return nil, err
	}

	var result models.UserEditCount
	for _, row := range rows {
		count := int(row.Count)

		switch row.Status {
		case "ACCEPTED":
			result.Accepted = count
		case "REJECTED":
			result.Rejected = count
		case "PENDING":
			result.Pending = count
		case "IMMEDIATE_ACCEPTED":
			result.ImmediateAccepted = count
		case "IMMEDIATE_REJECTED":
			result.ImmediateRejected = count
		case "FAILED":
			result.Failed = count
		case "CANCELED":
			result.Canceled = count
		}
	}

	return &result, nil
}

func (s *User) GetNotificationSubscriptions(ctx context.Context, userID uuid.UUID) ([]models.NotificationEnum, error) {
	rows, err := s.queries.GetUserNotificationSubscriptions(ctx, userID)
	if err != nil {
		return nil, err
	}

	var notifications []models.NotificationEnum
	for _, row := range rows {
		notifications = append(notifications, models.NotificationEnum(row))
	}

	return notifications, nil
}

func (s *User) GetRoles(ctx context.Context, userID uuid.UUID) ([]models.RoleEnum, error) {
	roleStrings, err := s.queries.GetUserRoles(ctx, userID)
	if err != nil {
		return nil, err
	}

	return converter.StringsToRoleEnums(roleStrings), nil
}

// NewUser registers a new user. It returns the activation key only if
// email verification is not required, otherwise it returns nil.
func (s *User) NewUser(ctx context.Context, emailAddr string, inviteKey *uuid.UUID) (*uuid.UUID, error) {
	// ensure user or pending activation with email does not already exist
	if err := validateUserEmail(emailAddr); err != nil {
		return nil, err
	}

	var err error
	var activationKey *uuid.UUID
	err = s.withTxn(func(tx *queries.Queries) error {
		if err := validateExistingEmail(ctx, tx, emailAddr); err != nil {
			return err
		}

		if err := validateInviteKey(ctx, tx, inviteKey); err != nil {
			return err
		}

		// generate an activation key and email
		activationToken, err := generateActivationKey(ctx, tx, emailAddr, inviteKey)
		if err != nil {
			return err
		}
		activationKey = &activationToken.ID

		// if activation is not required, then return the activation key
		if !config.GetRequireActivation() {
			return nil
		}

		return email.SendNewUserEmail(emailAddr, *activationKey, s.emailMgr)
	})

	return activationKey, err
}

func (s *User) Create(ctx context.Context, input models.UserCreateInput) (*models.User, error) {
	var user *models.User
	err := s.withTxn(func(tx *queries.Queries) error {
		createdUser, err := createUser(ctx, tx, input, true)
		if createdUser != nil {
			user = converter.UserToModelPtr(*createdUser)
		}
		return err
	})

	return user, err
}

func (s *User) Update(ctx context.Context, input models.UserUpdateInput) (*models.User, error) {
	var user queries.User
	err := s.withTxn(func(tx *queries.Queries) error {
		existingUser, err := tx.FindUser(ctx, input.ID)
		if err != nil {
			return err
		}

		// Validate changes and permissions
		if err := validateUpdate(ctx, input, existingUser); err != nil {
			return err
		}

		hash := existingUser.PasswordHash
		if input.Password != nil {
			hash, err = hashPassword(*input.Password)
			if err != nil {
				return fmt.Errorf("error updating user")
			}
		}

		params := converter.UpdateUserFromUpdateInput(existingUser, input, hash)
		user, err = tx.UpdateUser(ctx, params)
		if err != nil {
			return err
		}

		// Update roles
		// TODO - only do this if provided
		return updateRoles(ctx, tx, user.ID, input.Roles)
	})

	return converter.UserToModelPtr(user), err
}

func (s *User) Delete(ctx context.Context, input models.UserDestroyInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		existingUser, err := tx.FindUser(ctx, input.ID)
		if err != nil {
			return err
		}

		if err := validateDelete(existingUser); err != nil {
			return err
		}

		if err := tx.DeleteUser(ctx, input.ID); err != nil {
			return err
		}

		return tx.CancelUserEdits(ctx, uuid.NullUUID{UUID: input.ID, Valid: true})
	})
}

func (s *User) RegenerateAPIKey(ctx context.Context, userID *uuid.UUID) (string, error) {
	currentUser := auth.GetCurrentUser(ctx)

	if userID != nil {
		if currentUser.ID != *userID {
			// changing another user api key
			// must be admin
			if err := auth.ValidateAdmin(ctx); err != nil {
				return "", err
			}
		}
	} else {
		// changing current user api key
		userID = &currentUser.ID
	}

	key := ""
	err := s.withTxn(func(tx *queries.Queries) error {
		user, err := tx.FindUser(ctx, *userID)
		if err != nil {
			return fmt.Errorf("error finding user: %w", err)
		}

		key, err = generateAPIKey(user.ID.String())
		if err != nil {
			return fmt.Errorf("error generating APIKey: %w", err)
		}

		return tx.UpdateUserAPIKey(ctx, queries.UpdateUserAPIKeyParams{
			ID:     *userID,
			ApiKey: key,
		})
	})

	return key, err
}

func (s *User) ResetPassword(ctx context.Context, input models.ResetPasswordInput) error {
	return s.withTxn(func(tx *queries.Queries) error {
		u, err := tx.FindUserByEmail(ctx, input.Email)
		if err != nil {
			return err
		}

		// Sleep between 500-1500ms to avoid leaking email presence
		n := rand.Intn(1000)
		time.Sleep(time.Duration(500+n) * time.Millisecond)

		// generate an activation key and email
		key, err := generateResetPasswordActivationKey(ctx, tx, u.ID)
		if err != nil {
			return err
		}

		return email.SendResetPasswordEmail(u, *key, s.emailMgr)
	})
}

func (s *User) ChangePassword(ctx context.Context, input models.UserChangePasswordInput) error {
	currentUser := auth.GetCurrentUser(ctx)

	if input.ResetKey != nil {
		return s.withTxn(func(tx *queries.Queries) error {
			return activateResetPassword(ctx, tx, *input.ResetKey, input.NewPassword)
		})
	}

	// just setting password
	if currentUser == nil {
		return auth.ErrUnauthorized
	}

	if input.ExistingPassword == nil {
		return ErrCurrentPasswordIncorrect
	}

	return s.withTxn(func(tx *queries.Queries) error {
		return changePassword(ctx, tx, currentUser.ID, *input.ExistingPassword, input.NewPassword)
	})
}

func (s *User) ActivateNewUser(ctx context.Context, input models.ActivateNewUserInput) (*models.User, error) {
	var user queries.User
	err := s.withTxn(func(tx *queries.Queries) error {
		token, err := tx.FindUserToken(ctx, input.ActivationKey)
		if err != nil {
			return err
		}
		if token.Type != models.UserTokenTypeNewUser {
			return ErrInvalidActivationKey
		}

		data, err := getNewUserTokenData(token)
		if err != nil {
			return err
		}

		var invitedBy *uuid.UUID
		if config.GetRequireInvite() {
			if data.InviteKey == nil {
				return errors.New("cannot find invite key")
			}

			invite, err := tx.FindInviteKey(ctx, *data.InviteKey)
			if err != nil {
				return err
			}

			invitedBy = &invite.GeneratedBy
		}

		createInput := models.UserCreateInput{
			Name:        input.Name,
			Email:       data.Email,
			Password:    input.Password,
			InvitedByID: invitedBy,
			Roles:       getDefaultUserRoles(),
		}

		if _, err := tx.FindUserByName(ctx, createInput.Name); !errors.Is(err, pgx.ErrNoRows) {
			if err != nil {
				return err
			}
			return errors.New("username already used")
		}

		createdUser, err := createUser(ctx, tx, createInput, true)
		if err != nil {
			return err
		}
		user = *createdUser

		// delete the activation
		if err := tx.DeleteUserToken(ctx, token.ID); err != nil {
			return err
		}

		if config.GetRequireInvite() {
			// decrement the invite key uses
			usesLeft, err := tx.InviteKeyUsed(ctx, *data.InviteKey)
			if err != nil {
				return err
			}

			// if all used up, then delete the invite key
			if usesLeft != nil && *usesLeft <= 0 {
				// delete the invite key
				if err := tx.DeleteUserToken(ctx, *data.InviteKey); err != nil {
					return err
				}
			}
		}

		return nil
	})

	return converter.UserToModelPtr(user), err
}

func (s *User) GenerateInviteCodes(ctx context.Context, input *models.GenerateInviteCodeInput) ([]uuid.UUID, error) {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := auth.ValidateInvite(ctx); err == nil {
		requireToken = false
	}

	currentUser := auth.GetCurrentUser(ctx)
	var ret []uuid.UUID
	err := s.withTxn(func(tx *queries.Queries) error {
		keys, err := generateInviteKeys(ctx, tx, currentUser.ID, input, requireToken)
		if err != nil {
			return err
		}

		ret = append(ret, keys...)

		return nil
	})

	return ret, err
}

func (s *User) GenerateInviteCode(ctx context.Context) (*uuid.UUID, error) {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := auth.ValidateInvite(ctx); err == nil {
		requireToken = false
	}

	currentUser := auth.GetCurrentUser(ctx)

	var ret *uuid.UUID
	err := s.withTxn(func(tx *queries.Queries) error {

		keys := 1
		uses := 1
		input := &models.GenerateInviteCodeInput{
			Keys: &keys,
			Uses: &uses,
		}

		inviteKeys, txnErr := generateInviteKeys(ctx, tx, currentUser.ID, input, requireToken)
		if txnErr != nil {
			return txnErr
		}

		if len(inviteKeys) == 0 {
			return errors.New("no invite code generated")
		}

		ret = &inviteKeys[0]

		return nil
	})

	return ret, err
}

func (s *User) RescindInviteCode(ctx context.Context, inviteKeyID uuid.UUID) error {
	// INVITE role allows generating invite keys without tokens
	requireToken := true
	if err := auth.ValidateInvite(ctx); err == nil {
		requireToken = false
	}

	tokenManagerErr := auth.ValidateManageInvites(ctx)

	currentUser := auth.GetCurrentUser(ctx)
	return s.withTxn(func(tx *queries.Queries) error {
		userID := currentUser.ID

		// Non-token managers may only rescind their own invite code
		if tokenManagerErr == nil {
			inviteKey, err := tx.FindInviteKey(ctx, inviteKeyID)
			if err != nil {
				return err
			}

			userID = inviteKey.GeneratedBy
		}

		err := rescindInviteKey(ctx, tx, inviteKeyID, userID, requireToken)
		if err != nil {
			return err
		}

		return nil
	})
}

func (s *User) GrantInvite(ctx context.Context, input models.GrantInviteInput) (int, error) {
	if err := auth.ValidateManageInvites(ctx); err != nil {
		return 0, err
	}

	var ret int
	err := s.withTxn(func(tx *queries.Queries) error {
		count, err := grantInviteTokens(ctx, tx, input.UserID, input.Amount)
		ret = count

		return err
	})

	return ret, err
}

func (s *User) RevokeInvite(ctx context.Context, input models.RevokeInviteInput) (int, error) {
	if err := auth.ValidateManageInvites(ctx); err != nil {
		return 0, err
	}

	var ret int
	err := s.withTxn(func(tx *queries.Queries) error {
		count, err := repealInviteTokens(ctx, tx, input.UserID, input.Amount)
		ret = count

		return err
	})

	return ret, err
}

func (s *User) RequestChangeEmail(ctx context.Context) (models.UserChangeEmailStatus, error) {
	currentUser := auth.GetCurrentUser(ctx)

	err := s.withTxn(func(tx *queries.Queries) error {
		return email.ConfirmOldEmail(ctx, tx, *currentUser, s.emailMgr)
	})

	if err != nil {
		return models.UserChangeEmailStatusError, err
	}
	return models.UserChangeEmailStatusConfirmOld, nil
}

func (s *User) ValidateChangeEmail(ctx context.Context, tokenID uuid.UUID, emailAddr string) (models.UserChangeEmailStatus, error) {
	err := s.withTxn(func(tx *queries.Queries) error {

		token, err := tx.FindUserToken(ctx, tokenID)
		if err != nil {
			return err
		}

		data, err := getUserTokenData(token)
		if err != nil {
			return err
		}

		currentUser := auth.GetCurrentUser(ctx)
		if data.UserID != currentUser.ID {
			return fmt.Errorf("invalid token")
		}

		return email.ConfirmNewEmail(ctx, tx, *currentUser, emailAddr, s.emailMgr)
	})

	if err != nil {
		return models.UserChangeEmailStatusError, err
	}
	return models.UserChangeEmailStatusConfirmNew, nil
}

func (s *User) ConfirmChangeEmail(ctx context.Context, tokenID uuid.UUID) (models.UserChangeEmailStatus, error) {
	err := s.withTxn(func(tx *queries.Queries) error {
		token, err := tx.FindUserToken(ctx, tokenID)
		if err != nil {
			return err
		}

		data, err := getChangeEmailTokenData(token)
		if err != nil {
			return err
		}

		currentUser := auth.GetCurrentUser(ctx)
		if data.UserID != currentUser.ID {
			return fmt.Errorf("invalid token")
		}

		return email.ChangeEmail(ctx, tx, data)
	})

	if err != nil {
		return models.UserChangeEmailStatusError, err
	}
	return models.UserChangeEmailStatusSuccess, nil
}

func (s *User) CreateSystemUsers(ctx context.Context) {
	// if there are no users present, then create a root user with a
	// generated password and api key, outputting them
	var rootPassword string
	var createdUser *models.User

	err := s.withTxn(func(tx *queries.Queries) error {
		_, err := tx.FindUserByName(ctx, rootUserName)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			panic(fmt.Errorf("error getting root user: %w", err))
		}

		if errors.Is(err, pgx.ErrNoRows) {
			rootPassword, err = utils.GenerateRandomPassword(16)
			if err != nil {
				panic(fmt.Errorf("error creating root user: %w", err))
			}
			newUser := models.UserCreateInput{
				Name:     rootUserName,
				Password: rootPassword,
				Email:    unsetEmail,
				Roles:    rootUserRoles,
			}

			dbUser, err := createUser(ctx, tx, newUser, false)
			if err != nil {
				return err
			}
			createdUser = converter.UserToModelPtr(*dbUser)
		}

		_, err = tx.FindUserByName(ctx, modUserName)
		if err != nil && !errors.Is(err, pgx.ErrNoRows) {
			panic(fmt.Errorf("error getting mod user: %w", err))
		}

		if errors.Is(err, pgx.ErrNoRows) {
			password, err := utils.GenerateRandomPassword(32)
			if err != nil {
				panic(fmt.Errorf("error creating root user: %w", err))
			}
			newUser := models.UserCreateInput{
				Name:     modUserName,
				Password: password,
				Email:    "stashbot@example.com",
				Roles:    modUserRoles,
			}

			if _, err = createUser(ctx, tx, newUser, false); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		panic(fmt.Errorf("error creating system users: %w", err))
	}

	if createdUser != nil {
		// print (not log) the details of the created user
		// Skip output during tests
		if flag.Lookup("test.v") == nil {
			fmt.Printf("root user has been created.\nUser: %s\nPassword: %s\nAPI Key: %s\n", rootUserName, rootPassword, createdUser.APIKey)
			fmt.Print("These credentials have not been logged. The email should be set and the password should be changed after logging in.\n")
		}
	}
}

// Authenticate validates the provided username and password. If correct, it
// returns the id of the user.
func (s *User) Authenticate(ctx context.Context, username string, password string) (string, error) {
	user, err := s.queries.FindUserByName(ctx, username)
	if err != nil {
		return "", err
	}

	if !isPasswordCorrect(user.PasswordHash, password) {
		return "", ErrAccessDenied
	}

	return user.ID.String(), nil
}
