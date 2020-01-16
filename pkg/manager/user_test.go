package manager_test

import (
	"testing"

	. "github.com/stashapp/stashdb/pkg/manager"
	"github.com/stashapp/stashdb/pkg/models"
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

func TestValidateUserName(t *testing.T) {
	for _, v := range userNameScenarios {
		input := makeValidUserCreateInput()
		input.Name = v.username

		err := ValidateUserCreate(input)

		if err != v.err {
			t.Errorf("name: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}

func TestValidateUserEmail(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserCreateInput()
		input.Email = v.email

		err := ValidateUserCreate(input)

		if err != v.err {
			t.Errorf("email: %s - got %v; want %v", v.email, err, v.err)
		}
	}
}

func TestValidatePassword(t *testing.T) {
	for _, v := range userEmailScenarios {
		input := makeValidUserCreateInput()
		input.Email = v.email

		err := ValidateUserCreate(input)

		if err != v.err {
			t.Errorf("password: %s - got %v; want %v", v.email, err, v.err)
		}
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

		err := ValidateDestroyUser(user)

		if err != v.err {
			t.Errorf("username: %s - got %v; want %v", v.username, err, v.err)
		}
	}
}
