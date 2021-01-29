package user_test

import (
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
	. "github.com/stashapp/stash-box/pkg/user"
)

const (
	DefaultUsername = "ValidUsername"
	DefaultPassword = "TotallyValidPassword"
	DefaultEmail    = "valid@email.com"
)

type userNameTest struct {
	username string
	err      error
}

var userNameScenarios []userNameTest = []userNameTest{
	{"", ErrEmptyUsername},
	{"  aa", ErrUsernameHasWhitespace},
	{"\taa", ErrUsernameHasWhitespace},
	{"aa  ", ErrUsernameHasWhitespace},
	{"aa\t", ErrUsernameHasWhitespace},
	{"aa aa", nil},
	{"aa\taa", nil},
}

type userEmailTest struct {
	email string
	err   error
}

var userEmailScenarios []userEmailTest = []userEmailTest{
	{"", ErrEmptyEmail},
	{"just a string", ErrInvalidEmail},
	{"   aa@bb.com", ErrEmailHasWhitespace},
	{"aa@bb.com    ", ErrEmailHasWhitespace},
	{"aa\t@bb.com", ErrInvalidEmail},
	{"aa@bb", ErrInvalidEmail},
	{"abc@def.com", nil},
}

type userPasswordTest struct {
	password string
	err      error
}

var userPasswordScenarios []userPasswordTest = []userPasswordTest{
	{"", ErrPasswordTooShort},
	{"fyebg25", ErrPasswordTooShort},
	{"password901234567890123456789012345678901234567890123456789012345", ErrPasswordTooLong},
	{"qhdyydhq", ErrPasswordInsufficientUniqueChars},
	{"password", ErrBannedPassword},
	{DefaultUsername, ErrPasswordUsername},
	{DefaultEmail, ErrPasswordEmail},
	{"abcdeabcde", nil},
}

func makeValidUserCreateInput() models.UserCreateInput {
	return models.UserCreateInput{
		Name:     DefaultUsername,
		Password: DefaultPassword,
		Email:    DefaultEmail,
	}
}

func TestValidateUserNameCreate(t *testing.T) {
	for _, v := range userNameScenarios {
		input := makeValidUserCreateInput()
		input.Name = v.username

		err := ValidateCreate(input)

		if err != v.err {
			t.Errorf("name: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}

func TestValidateUserEmailCreate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserCreateInput()
		input.Email = v.email

		err := ValidateCreate(input)

		if err != v.err {
			t.Errorf("email: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestValidatePasswordCreate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserCreateInput()
		input.Email = v.email

		err := ValidateCreate(input)

		if err != v.err {
			t.Errorf("password: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func makeValidUser() models.User {
	return models.User{
		Name:  DefaultUsername,
		Email: DefaultEmail,
	}
}

func makeValidUserUpdateInput() models.UserUpdateInput {
	return models.UserUpdateInput{
		ID: "id",
	}
}

func TestValidateUserNameUpdate(t *testing.T) {
	for _, v := range userNameScenarios {
		input := makeValidUserUpdateInput()
		input.Name = &v.username

		err := ValidateUpdate(input, makeValidUser())

		if err != v.err {
			t.Errorf("name: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}

func TestValidateUserEmailUpdate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserUpdateInput()
		input.Email = &v.email

		err := ValidateUpdate(input, makeValidUser())

		if err != v.err {
			t.Errorf("email: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestValidatePasswordUpdate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserUpdateInput()
		input.Email = &v.email

		err := ValidateUpdate(input, makeValidUser())

		if err != v.err {
			t.Errorf("password: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestChangeRootUsername(t *testing.T) {
	input := makeValidUserUpdateInput()
	newName := "changedRoot"
	input.Name = &newName

	rootUser := makeValidUser()
	rootUser.Name = "root"
	err := ValidateUpdate(input, rootUser)

	if err != ErrChangeRootName {
		t.Errorf("change root username: got %v; want %v", err, ErrChangeRootName)
	}
}

func TestChangeRootRoles(t *testing.T) {
	input := makeValidUserUpdateInput()
	input.Roles = []models.RoleEnum{
		models.RoleEnumModify,
	}

	rootUser := makeValidUser()
	rootUser.Name = "root"
	err := ValidateUpdate(input, rootUser)

	if err != ErrChangeRootRoles {
		t.Errorf("change root roles: got %v; want %v", err, ErrChangeRootRoles)
	}
}

var destroyUserScenarios []userNameTest = []userNameTest{
	{"root", ErrDeleteRoot},
	{"user", nil},
}

func TestDestroyUser(t *testing.T) {
	for _, v := range destroyUserScenarios {
		user := &models.User{
			Name: v.username,
		}

		err := ValidateDestroy(user)

		if err != v.err {
			t.Errorf("username: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}
