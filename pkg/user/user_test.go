package user_test

import (
	"testing"

	"github.com/stashapp/stash-box/pkg/models"
	"github.com/stashapp/stash-box/pkg/user"
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

var userNameScenarios = []userNameTest{
	{"", user.ErrEmptyUsername},
	{"  aa", user.ErrUsernameHasWhitespace},
	{"\taa", user.ErrUsernameHasWhitespace},
	{"aa  ", user.ErrUsernameHasWhitespace},
	{"aa\t", user.ErrUsernameHasWhitespace},
	{"aa aa", nil},
	{"aa\taa", nil},
}

type userEmailTest struct {
	email string
	err   error
}

var userEmailScenarios = []userEmailTest{
	{"", user.ErrEmptyEmail},
	{"just a string", user.ErrInvalidEmail},
	{"   aa@bb.com", user.ErrEmailHasWhitespace},
	{"aa@bb.com    ", user.ErrEmailHasWhitespace},
	{"aa\t@bb.com", user.ErrInvalidEmail},
	{"aa@bb", user.ErrInvalidEmail},
	{"abc@def.com", nil},
}

type userPasswordTest struct {
	password string
	err      error
}

var userPasswordScenarios = []userPasswordTest{
	{"", user.ErrPasswordTooShort},
	{"fyebg25", user.ErrPasswordTooShort},
	{"password901234567890123456789012345678901234567890123456789012345", user.ErrPasswordTooLong},
	{"qhdyydhq", user.ErrPasswordInsufficientUniqueChars},
	{"password", user.ErrBannedPassword},
	{DefaultUsername, user.ErrPasswordUsername},
	{DefaultEmail, user.ErrPasswordEmail},
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

		err := user.ValidateCreate(input)

		if err != v.err {
			t.Errorf("name: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}

func TestValidateUserEmailCreate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserCreateInput()
		input.Email = v.email

		err := user.ValidateCreate(input)

		if err != v.err {
			t.Errorf("email: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestValidatePasswordCreate(t *testing.T) {
	for _, v := range userPasswordScenarios {
		input := makeValidUserCreateInput()
		input.Password = v.password

		err := user.ValidateCreate(input)

		if err != v.err {
			t.Errorf("password: %s - got %v; want %v", v.password, err, v.err)
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

		err := user.ValidateUpdate(input, makeValidUser())

		if err != v.err {
			t.Errorf("name: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}

func TestValidateUserEmailUpdate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserUpdateInput()
		input.Email = &v.email

		err := user.ValidateUpdate(input, makeValidUser())

		if err != v.err {
			t.Errorf("email: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestValidatePasswordUpdate(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserUpdateInput()
		input.Email = &v.email

		err := user.ValidateUpdate(input, makeValidUser())

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
	err := user.ValidateUpdate(input, rootUser)

	if err != user.ErrChangeRootName {
		t.Errorf("change root username: got %v; want %v", err, user.ErrChangeRootName)
	}
}

func TestChangeRootRoles(t *testing.T) {
	input := makeValidUserUpdateInput()
	input.Roles = []models.RoleEnum{
		models.RoleEnumModify,
	}

	rootUser := makeValidUser()
	rootUser.Name = "root"
	err := user.ValidateUpdate(input, rootUser)

	if err != user.ErrChangeRootRoles {
		t.Errorf("change root roles: got %v; want %v", err, user.ErrChangeRootRoles)
	}
}

var destroyUserScenarios = []userNameTest{
	{"root", user.ErrDeleteRoot},
	{"user", nil},
}

func TestDestroyUser(t *testing.T) {
	for _, v := range destroyUserScenarios {
		u := &models.User{
			Name: v.username,
		}

		err := user.ValidateDestroy(u)

		if err != v.err {
			t.Errorf("username: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}
