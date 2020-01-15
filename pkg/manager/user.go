package manager

import (
	"context"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"

	"github.com/stashapp/stashdb/pkg/database"
	"github.com/stashapp/stashdb/pkg/models"
	"github.com/stashapp/stashdb/pkg/utils"
)

func UserCreate(tx *sqlx.Tx, input models.UserCreateInput) (*models.User, error) {
	var err error

	UUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	// Populate a new studio from the input
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

func UserUpdate(tx *sqlx.Tx, input models.UserUpdateInput) (*models.User, error) {
	qb := models.NewUserQueryBuilder(tx)

	// get the existing studio and modify it
	userID, _ := uuid.FromString(input.ID)
	updatedUser, err := qb.Find(userID)

	if err != nil {
		return nil, err
	}

	updatedUser.UpdatedAt = models.SQLiteTimestamp{Timestamp: time.Now()}

	// Populate studio from the input
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

func UserDestroy(tx *sqlx.Tx, input models.UserDestroyInput) (bool, error) {
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

const rootUserName = "root"
const unsetEmail = "none"

// CreateRootUser creates the initial root user if no users are present
func CreateRootUser() {
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
		}

		createdUser, err := UserCreate(tx, newUser)

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
