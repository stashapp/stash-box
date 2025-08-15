package user

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/manager/notifications"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	minPasswordLength = 8
	maxPasswordLength = 64
	minUniqueChars    = 5

	rootUserName = "root"
	modUserName  = "StashBot"
	unsetEmail   = "none"
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

// Cached instance of StashBot, which is used for automated edit comments
var modUser *models.User

var rootUserRoles []models.RoleEnum = []models.RoleEnum{
	models.RoleEnumAdmin,
}
var modUserRoles []models.RoleEnum = []models.RoleEnum{
	models.RoleEnumBot,
}

func ValidateCreate(input models.UserCreateInput) error {
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
	err = validateUserPassword(input.Name, input.Email, input.Password)
	if err != nil {
		return err
	}

	return nil
}

func ValidateUpdate(input models.UserUpdateInput, current models.User) error {
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
		err := validateUserPassword(currentName, currentEmail, *input.Password)
		if err != nil {
			return err
		}
	}

	return nil
}

func ValidateDestroy(user *models.User) error {
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

func validateUserPassword(username string, email string, password string) error {
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

func Create(fac models.Repo, input models.UserCreateInput) (*models.User, error) {
	var err error

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new user from the input
	currentTime := time.Now()
	newUser := models.User{
		ID: UUID,
		// set last API call to now just so that it has a value
		LastAPICall: currentTime,
		CreatedAt:   currentTime,
		UpdatedAt:   currentTime,
	}

	err = newUser.CopyFromCreateInput(input)
	if err != nil {
		return nil, err
	}

	apiKey, err := GenerateAPIKey(newUser.ID.String())
	if err != nil {
		return nil, fmt.Errorf("error generating APIKey: %w", err)
	}

	newUser.APIKey = apiKey

	// Start the transaction and save the user
	qb := fac.User()
	user, err := qb.Create(newUser)
	if err != nil {
		return nil, err
	}

	// Save the roles
	userRoles := models.CreateUserRoles(user.ID, input.Roles)
	if err := qb.CreateRoles(userRoles); err != nil {
		return nil, err
	}

	// Save the notification subscriptions
	notificationSubscriptions := models.CreateUserNotifications(user.ID, notifications.GetDefaultSubscriptions())
	if err := fac.Joins().UpdateUserNotifications(user.ID, notificationSubscriptions); err != nil {
		return nil, err
	}

	return user, nil
}

func Update(fac models.Repo, input models.UserUpdateInput) (*models.User, error) {
	qb := fac.User()

	// get the existing user and modify it
	updatedUser, err := qb.Find(input.ID)

	if err != nil {
		return nil, err
	}

	updatedUser.UpdatedAt = time.Now()

	// Populate user from the input
	err = updatedUser.CopyFromUpdateInput(input)
	if err != nil {
		return nil, err
	}

	user, err := qb.Update(*updatedUser)
	if err != nil {
		return nil, err
	}

	// Save the roles
	// TODO - only do this if provided
	userRoles := models.CreateUserRoles(user.ID, input.Roles)
	if err := qb.UpdateRoles(user.ID, userRoles); err != nil {
		return nil, err
	}

	return user, nil
}

func Destroy(fac models.Repo, input models.UserDestroyInput) (bool, error) {
	qb := fac.User()

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	if err := qb.Destroy(input.ID); err != nil {
		return false, err
	}

	return true, nil
}

// CreateSystemUsers creates mandatory system users if they do not exist
func CreateSystemUsers(fac models.Repo) {
	// if there are no users present, then create a root user with a
	// generated password and api key, outputting them
	var rootPassword string
	var createdUser *models.User

	err := fac.WithTxn(func() error {
		qb := fac.User()

		root, err := qb.FindByName(rootUserName)
		if err != nil {
			panic(fmt.Errorf("error getting root user: %w", err))
		}

		if root == nil {
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

			createdUser, err = Create(fac, newUser)
			if err != nil {
				return err
			}
		}

		modUser, err := qb.FindByName(modUserName)
		if err != nil {
			panic(fmt.Errorf("error getting mod user: %w", err))
		}

		if modUser == nil {
			password, err := utils.GenerateRandomPassword(32)
			if err != nil {
				panic(fmt.Errorf("error creating root user: %w", err))
			}
			newUser := models.UserCreateInput{
				Name:     modUserName,
				Password: password,
				Email:    "mod_mail",
				Roles:    modUserRoles,
			}

			_, err = Create(fac, newUser)
			if err != nil {
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
		fmt.Printf("root user has been created.\nUser: %s\nPassword: %s\nAPI Key: %s\n", rootUserName, rootPassword, createdUser.APIKey)
		fmt.Print("These credentials have not been logged. The email should be set and the password should be changed after logging in.\n")
	}
}

func Get(fac models.Repo, id string) (*models.User, error) {
	qb := fac.User()
	userID, _ := uuid.FromString(id)
	return qb.Find(userID)
}

func GetRoles(fac models.Repo, id string) ([]models.RoleEnum, error) {
	qb := fac.User()

	userID, _ := uuid.FromString(id)
	roles, err := qb.GetRoles(userID)

	if err != nil {
		return nil, fmt.Errorf("error getting user roles: %w", err)
	}

	return roles.ToRoles(), nil
}

// Authenticate validates the provided username and password. If correct, it
// returns the id of the user.
func Authenticate(fac models.Repo, username string, password string) (string, error) {
	qb := fac.User()

	user, err := qb.FindByName(username)
	if err != nil {
		return "", err
	}

	if user == nil {
		return "", ErrAccessDenied
	}

	if !user.IsPasswordCorrect(password) {
		return "", ErrAccessDenied
	}

	return user.ID.String(), nil
}

func RegenerateAPIKey(fac models.Repo, userID uuid.UUID) (string, error) {
	var err error

	qb := fac.User()
	user, err := qb.Find(userID)

	if err != nil {
		return "", fmt.Errorf("error finding user: %w", err)
	}

	if user == nil {
		return "", fmt.Errorf("user not found for id %s", userID)
	}

	user.APIKey, err = GenerateAPIKey(user.ID.String())
	if err != nil {
		return "", fmt.Errorf("error generating APIKey: %w", err)
	}

	user.UpdatedAt = time.Now()
	user, err = qb.Update(*user)
	if err != nil {
		return "", err
	}

	return user.APIKey, nil
}

func ChangePassword(fac models.Repo, userID string, currentPassword string, newPassword string) error {
	qb := fac.User()

	userUUID, _ := uuid.FromString(userID)
	user, err := qb.Find(userUUID)

	if err != nil {
		return fmt.Errorf("error finding user: %w", err)
	}

	if user == nil {
		return fmt.Errorf("user not found for id %s", userID)
	}

	if !user.IsPasswordCorrect(currentPassword) {
		return ErrCurrentPasswordIncorrect
	}

	err = validateUserPassword(user.Name, user.Email, newPassword)
	if err != nil {
		return err
	}

	err = user.SetPasswordHash(newPassword)
	if err != nil {
		return err
	}
	user.UpdatedAt = time.Now()

	_, err = qb.Update(*user)
	return err
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

func PromoteUserVoteRights(fac models.Repo, userID uuid.UUID, threshold int) error {
	qb := fac.User()

	user, err := qb.Find(userID)
	if err != nil {
		return err
	}
	if user == nil {
		// nil user is valid so no need to return error
		return nil
	}

	roles, err := qb.GetRoles(userID)
	if err != nil {
		return err
	}

	for _, role := range roles.ToRoles() {
		if role == models.RoleEnumReadOnly {
			return nil
		}
	}

	hasVote := false
	for _, role := range roles.ToRoles() {
		if role.Implies(models.RoleEnumVote) {
			hasVote = true
		}
	}

	if !hasVote {
		editCount, err := qb.CountEditsByStatus(userID)
		if err != nil {
			return nil
		}

		if (editCount.Accepted + editCount.ImmediateAccepted) >= threshold {
			userRoles := models.CreateUserRoles(userID, []models.RoleEnum{models.RoleEnumVote})
			return qb.CreateRoles(userRoles)
		}
	}

	return nil
}

func GetModUser(fac models.Repo) *models.User {
	if modUser == nil {
		user, err := fac.User().FindByName(modUserName)
		if err != nil {
			// If StashBot is not found it's a runtime exception
			panic(err)
		}
		modUser = user
	}

	return modUser
}
