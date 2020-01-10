package models

import (
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gofrs/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/stashapp/stashdb/pkg/database"
)

const (
	userTable   = "users"
	userJoinKey = "user_id"
)

var (
	userDBTable = database.NewTable(userTable, func() interface{} {
		return &User{}
	})

	userRolesTable = database.NewTableJoin(userTable, "user_roles", userJoinKey, func() interface{} {
		return &UserRole{}
	})
)

type User struct {
	ID           uuid.UUID       `db:"id" json:"id"`
	Name         string          `db:"name" json:"name"`
	PasswordHash string          `db:"password_hash" json:"password_hash"`
	Email        string          `db:"email" json:"email"`
	APIKey       string          `db:"api_key" json:"api_key"`
	APICalls     int             `db:"api_calls" json:"api_calls"`
	LastAPICall  SQLiteTimestamp `db:"last_api_call" json:"last_api_call"`
	CreatedAt    SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt    SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

func (User) GetTable() database.Table {
	return userDBTable
}

func (p User) GetID() uuid.UUID {
	return p.ID
}

type Users []*User

func (p Users) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Users) Add(o interface{}) {
	*p = append(*p, o.(*User))
}

type UserRole struct {
	UserID uuid.UUID `db:"user_id" json:"user_id"`
	Role   string    `db:"role" json:"role"`
}

type UserRoles []*UserRole

func (p UserRoles) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *UserRoles) Add(o interface{}) {
	*p = append(*p, o.(*UserRole))
}

func (p UserRoles) ToRoles() []RoleEnum {
	var ret []RoleEnum
	for _, v := range p {
		ret = append(ret, RoleEnum(v.Role))
	}

	return ret
}

func CreateUserRoles(userId uuid.UUID, roles []RoleEnum) UserRoles {
	var ret UserRoles

	for _, role := range roles {
		ret = append(ret, &UserRole{
			UserID: userId,
			Role:   role.String(),
		})
	}

	return ret
}

func (p *User) setPasswordHash(pw string) error {
	// generate password from input
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)

	if err != nil {
		return err
	}

	p.PasswordHash = string(hash)

	return nil
}

const APIKeySubject = "APIKey"

type APIKeyClaims struct {
	UserID string `json:"uid"`
	jwt.StandardClaims
}

func (p *User) generateAPIKey() error {
	claims := &APIKeyClaims{
		UserID: p.ID.String(),
		StandardClaims: jwt.StandardClaims{
			Subject:  APIKeySubject,
			IssuedAt: time.Now().Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	ss, err := token.SignedString(token)
	if err != nil {
		return err
	}

	p.APIKey = ss
	return nil
}

func (p *User) CopyFromCreateInput(input UserCreateInput) error {
	CopyFull(p, input)

	err := p.setPasswordHash(input.Password)

	if err != nil {
		return err
	}

	err = p.generateAPIKey()
	if err != nil {
		return err
	}

	return nil
}

func (p *User) CopyFromUpdateInput(input UserUpdateInput) error {
	CopyFull(p, input)

	// generate password from input
	if input.Password != nil {
		err := p.setPasswordHash(*input.Password)
		if err != nil {
			return err
		}
	}

	return nil
}
