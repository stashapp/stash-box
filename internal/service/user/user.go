package user

import (
	"context"
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/config"
	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

const (
	minPasswordLength = 8
	maxPasswordLength = 64
	minUniqueChars    = 5

	rootUserName = "root"
	modUserName  = "StashBot"
	unsetEmail   = "root@example.com"
)

var (
	ErrUserNotExist                    = errors.New("user not found")
	ErrEmptyUsername                   = errors.New("empty username")
	ErrUsernameHasWhitespace           = errors.New("username has leading or trailing whitespace")
	ErrUsernameMatchesEmail            = errors.New("username is the same as email")
	ErrEmptyEmail                      = errors.New("empty email")
	ErrEmailHasWhitespace              = errors.New("email has leading or trailing whitespace")
	ErrInvalidEmail                    = errors.New("not a valid email address")
	ErrPasswordTooShort                = fmt.Errorf("password length < %d", minPasswordLength)
	ErrPasswordTooLong                 = fmt.Errorf("password > %d", maxPasswordLength)
	ErrPasswordInsufficientUniqueChars = fmt.Errorf("password has < %d unique characters", minUniqueChars)
	ErrBannedPassword                  = errors.New("password matches a common password")
	ErrPasswordUsername                = errors.New("password matches username")
	ErrPasswordEmail                   = errors.New("password matches email")
	ErrDeleteSystemUser                = errors.New("system users cannot be deleted")
	ErrChangeModUser                   = errors.New("mod user cannot be modified")
	ErrChangeRootName                  = errors.New("cannot change root username")
	ErrChangeRootRoles                 = errors.New("cannot change root roles")
	ErrAccessDenied                    = errors.New("access denied")
	ErrCurrentPasswordIncorrect        = errors.New("current password incorrect")
)

var rootUserRoles []models.RoleEnum = []models.RoleEnum{
	models.RoleEnumAdmin,
}
var modUserRoles []models.RoleEnum = []models.RoleEnum{
	models.RoleEnumBot,
}

func createUser(ctx context.Context, tx *queries.Queries, input models.UserCreateInput, defaultNotifications bool) (*queries.User, error) {
	if err := validateCreate(input); err != nil {
		return nil, err
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	hash, err := hashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	key, err := generateAPIKey(id.String())
	if err != nil {
		return nil, err
	}

	params := converter.UserCreateInputToCreateParams(input, id, hash, key)
	user, err := tx.CreateUser(ctx, params)
	if err != nil {
		return nil, err
	}

	if err := createRoles(ctx, tx, id, input.Roles); err != nil {
		return nil, err
	}

	if defaultNotifications {
		err = createNotificationSubscriptions(ctx, tx, id, models.GetDefaultNotificationSubscriptions())
	}
	return &user, err
}

func changePassword(ctx context.Context, tx *queries.Queries, userID uuid.UUID, currentPassword string, newPassword string) error {
	user, err := tx.FindUser(ctx, userID)
	if err != nil {
		return fmt.Errorf("error finding user: %w", err)
	}

	if !isPasswordCorrect(user.PasswordHash, currentPassword) {
		return ErrCurrentPasswordIncorrect
	}

	err = validatePassword(user.Name, user.Email, newPassword)
	if err != nil {
		return err
	}

	hash, err := hashPassword(newPassword)
	if err != nil {
		return err
	}

	return tx.UpdateUserPassword(ctx, queries.UpdateUserPasswordParams{
		ID:           user.ID,
		PasswordHash: hash,
	})
}

func getDefaultUserRoles() []models.RoleEnum {
	roleStr := config.GetDefaultUserRoles()
	ret := []models.RoleEnum{}
	for _, v := range roleStr {
		e := models.RoleEnum(v)
		if e.IsValid() {
			ret = append(ret, e)
		}
	}

	return ret
}
