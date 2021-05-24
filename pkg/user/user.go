package user

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stash-box/pkg/database"
	"github.com/stashapp/stash-box/pkg/manager/config"
	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/utils"
)

const (
	minPasswordLength = 8
	maxPasswordLength = 64
	minUniqueChars    = 5

	rootUserName = "root"
	unsetEmail   = "none"
)

var (
	ErrUserNotExist                    = errors.New("user not found")
	ErrEmptyUsername                   = errors.New("empty username")
	ErrUsernameHasWhitespace           = errors.New("username has leading or trailing whitespace")
	ErrEmptyEmail                      = errors.New("empty email")
	ErrEmailHasWhitespace              = errors.New("email has leading or trailing whitespace")
	ErrInvalidEmail                    = errors.New("not a valid email address")
	ErrPasswordTooShort                = fmt.Errorf("password length < %d", minPasswordLength)
	ErrPasswordTooLong                 = fmt.Errorf("password > %d", maxPasswordLength)
	ErrPasswordInsufficientUniqueChars = fmt.Errorf("password has < %d unique characters", minUniqueChars)
	ErrBannedPassword                  = errors.New("password matches a common password")
	ErrPasswordUsername                = errors.New("password matches username")
	ErrPasswordEmail                   = errors.New("password matches email")
	ErrDeleteRoot                      = errors.New("root user cannot be deleted")
	ErrChangeRootName                  = errors.New("cannot change root username")
	ErrChangeRootRoles                 = errors.New("cannot change root roles")

	ErrAccessDenied             = errors.New("access denied")
	ErrCurrentPasswordIncorrect = errors.New("current password incorrect")
)

var rootUserRoles []models.RoleEnum = []models.RoleEnum{
	models.RoleEnumAdmin,
}

func ValidateCreate(input models.UserCreateInput) error {
	// username must be set
	err := validateUserName(input.Name)
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

		err := validateUserName(*input.Name)
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
	if user.Name == rootUserName {
		return ErrDeleteRoot
	}

	return nil
}

func validateUserName(username string) error {
	if username == "" {
		return ErrEmptyUsername
	}

	// username must not have leading or trailing whitespace
	trimmed := strings.TrimSpace(username)

	if trimmed != username {
		return ErrUsernameHasWhitespace
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

func Create(tx *sqlx.Tx, input models.UserCreateInput) (*models.User, error) {
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
		LastAPICall: models.SQLiteTimestamp{Timestamp: currentTime},
		CreatedAt:   models.SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt:   models.SQLiteTimestamp{Timestamp: currentTime},
	}

	err = newUser.CopyFromCreateInput(input)
	if err != nil {
		return nil, err
	}

	apiKey, err := GenerateAPIKey(newUser.ID.String())
	if err != nil {
		return nil, fmt.Errorf("Error generating APIKey: %s", err.Error())
	}

	newUser.APIKey = apiKey

	// Start the transaction and save the user
	qb := models.NewUserQueryBuilder(tx)
	user, err := qb.Create(newUser)
	if err != nil {
		return nil, err
	}

	// Save the roles
	userRoles := models.CreateUserRoles(user.ID, input.Roles)
	if err := qb.CreateRoles(userRoles); err != nil {
		return nil, err
	}

	return user, nil
}

func Update(tx *sqlx.Tx, input models.UserUpdateInput) (*models.User, error) {
	qb := models.NewUserQueryBuilder(tx)

	// get the existing user and modify it
	userID, _ := uuid.FromString(input.ID)
	updatedUser, err := qb.Find(userID)

	if err != nil {
		return nil, err
	}

	updatedUser.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

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

func Destroy(tx *sqlx.Tx, input models.UserDestroyInput) (bool, error) {
	qb := models.NewUserQueryBuilder(tx)

	// references have on delete cascade, so shouldn't be necessary
	// to remove them explicitly

	userID, err := uuid.FromString(input.ID)
	if err != nil {
		return false, err
	}
	if err = qb.Destroy(userID); err != nil {
		return false, err
	}

	return true, nil
}

// CreateRoot creates the initial root user if no users are present
func CreateRoot() {
	// if there are no users present, then create a root user with a
	// generated password and api key, outputting them
	ctx := context.TODO()
	tx := database.DB.MustBeginTx(ctx, nil)
	qb := models.NewUserQueryBuilder(tx)

	count, err := qb.Count()
	if err != nil {
		panic(fmt.Errorf("Error getting user count: %s", err.Error()))
	}

	if count == 0 {
		const passwordLength = 16
		password := utils.GenerateRandomPassword(passwordLength)
		newUser := models.UserCreateInput{
			Name:     "root",
			Password: password,
			Email:    unsetEmail,
			Roles:    rootUserRoles,
		}

		createdUser, err := Create(tx, newUser)

		if err == nil {
			err = tx.Commit()
		}

		if err != nil {
			tx.Rollback()
			panic(fmt.Errorf("Error creating root user: %s", err.Error()))
		}

		// print (not log) the details of the created user
		fmt.Printf("root user has been created.\nUser: root\nPassword: %s\nAPI Key: %s\n", password, createdUser.APIKey)
		fmt.Print("These credentials have not been logged. The email should be set and the password should be changed after logging in.\n")
	}
}

func Get(id string) (*models.User, error) {
	qb := models.NewUserQueryBuilder(nil)
	userID, _ := uuid.FromString(id)
	return qb.Find(userID)
}

func GetRoles(id string) ([]models.RoleEnum, error) {
	qb := models.NewUserQueryBuilder(nil)

	userID, _ := uuid.FromString(id)
	roles, err := qb.GetRoles(userID)

	if err != nil {
		return nil, fmt.Errorf("Error getting user roles: %s", err.Error())
	}

	return roles.ToRoles(), nil
}

// Authenticate validates the provided username and password. If correct, it
// returns the id of the user.
func Authenticate(username string, password string) (string, error) {
	qb := models.NewUserQueryBuilder(nil)

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

func RegenerateAPIKey(tx *sqlx.Tx, userID string) (string, error) {
	var err error

	qb := models.NewUserQueryBuilder(tx)
	userUUID, _ := uuid.FromString(userID)
	user, err := qb.Find(userUUID)

	if err != nil {
		return "", fmt.Errorf("error finding user: %s", err.Error())
	}

	if user == nil {
		return "", fmt.Errorf("user not found for id %s", userID)
	}

	user.APIKey, err = GenerateAPIKey(user.ID.String())
	if err != nil {
		return "", fmt.Errorf("Error generating APIKey: %s", err.Error())
	}

	user.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}
	user, err = qb.Update(*user)
	if err != nil {
		return "", err
	}

	return user.APIKey, nil
}

func ChangePassword(tx *sqlx.Tx, userID string, currentPassword string, newPassword string) error {
	qb := models.NewUserQueryBuilder(tx)

	userUUID, _ := uuid.FromString(userID)
	user, err := qb.Find(userUUID)

	if err != nil {
		return fmt.Errorf("error finding user: %s", err.Error())
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
	user.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

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
