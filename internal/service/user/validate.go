package user

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/stashapp/stash-box/internal/auth"
	"github.com/stashapp/stash-box/internal/db"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

func validateCreate(input models.UserCreateInput) error {
	// username must be set
	err := validateUserName(input.Name, &input.Email)
	if err != nil {
		return err
	}

	// email must be valid
	err = validateUserEmail(input.Email)
	if err != nil {
		return err
	}

	// password must be valid according to policy
	err = validatePassword(input.Name, input.Email, input.Password)
	if err != nil {
		return err
	}

	return nil
}

func validateUpdate(ctx context.Context, input models.UserUpdateInput, current db.User) error {
	currentName := current.Name
	currentEmail := current.Email

	if currentName == modUserName {
		return ErrChangeModUser
	}

	if currentName == rootUserName {
		if input.Name != nil && *input.Name != rootUserName {
			return ErrChangeRootName
		}

		// TODO - this means that we must include roles in the input
		if len(input.Roles) != len(rootUserRoles) || input.Roles[0] != rootUserRoles[0] {
			return ErrChangeRootRoles
		}
	}

	if input.Name != nil {
		currentName = *input.Name

		err := validateUserName(*input.Name, input.Email)
		if err != nil {
			return err
		}
	}

	// email must be valid
	if input.Email != nil {
		currentEmail = *input.Email
		err := validateUserEmail(*input.Email)
		if err != nil {
			return err
		}
	} else if current.Email == unsetEmail {
		return ErrEmptyEmail
	}

	// password must be valid according to policy
	if input.Password != nil {
		err := validatePassword(currentName, currentEmail, *input.Password)
		if err != nil {
			return err
		}
	}

	if input.Name != nil && *input.Name != current.Name {
		if err := auth.ValidateAdmin(ctx); err != nil {
			return err
		}
	}

	return nil
}

func validateDelete(user db.User) error {
	if user.Name == rootUserName || user.Name == modUserName {
		return ErrDeleteSystemUser
	}

	return nil
}

func validateUserName(username string, email *string) error {
	if username == "" {
		return ErrEmptyUsername
	}

	// username must not have leading or trailing whitespace
	trimmed := strings.TrimSpace(username)

	if trimmed != username {
		return ErrUsernameHasWhitespace
	}

	if email != nil && *email == trimmed {
		return ErrUsernameMatchesEmail
	}

	return nil
}

func validateUserEmail(email string) error {
	if email == "" {
		return ErrEmptyEmail
	}

	// email must not have leading or trailing whitespace
	trimmed := strings.TrimSpace(email)

	if trimmed != email {
		return ErrEmailHasWhitespace
	}

	// from https://stackoverflow.com/a/201378
	const emailRegex = "(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|\"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])"
	re := regexp.MustCompile(emailRegex)

	if !re.MatchString(email) {
		return ErrInvalidEmail
	}

	return nil
}

func countUniqueCharacters(str string) int {
	chars := make(map[rune]bool)
	for _, r := range str {
		chars[r] = true
	}

	return len(chars)
}

func validatePassword(username string, email string, password string) error {
	// TODO - hardcode these policies for now. We may want to make these
	// configurable in future

	if len(password) < minPasswordLength {
		return ErrPasswordTooShort
	}

	if len(password) > maxPasswordLength {
		return ErrPasswordTooLong
	}

	if countUniqueCharacters(password) < minUniqueChars {
		return ErrPasswordInsufficientUniqueChars
	}

	// ensure password doesn't match the top 10,000 passwords over the minimum length
	if utils.IsBannedPassword(password) {
		return ErrBannedPassword
	}

	// ensure password doesn't match the username or email
	if password == username {
		return ErrPasswordUsername
	}

	if password == email {
		return ErrPasswordEmail
	}

	return nil
}

func validateExistingEmail(ctx context.Context, tx *db.Queries, email string) error {
	_, err := tx.FindUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil
	}

	return err
}

func validateInviteKey(ctx context.Context, tx *db.Queries, inviteKey *uuid.UUID) error {
	if config.GetRequireInvite() {
		if inviteKey == nil {
			return errors.New("invite key required")
		}

		key, err := tx.FindInviteKey(ctx, *inviteKey)
		if err != nil {
			return err
		}

		// ensure invite key is not expired
		if key.ExpireTime != nil && key.ExpireTime.Before(time.Now()) {
			return errors.New("invite key expired")
		}

		// ensure key isn't already used
		t, _ := tx.FindUserTokensByInviteKey(ctx, *inviteKey)

		if key.Uses != nil && len(t) >= int(*key.Uses) {
			return errors.New("key already used")
		}
	}

	return nil
}
