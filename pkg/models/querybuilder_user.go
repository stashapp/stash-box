package models

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stashdb/pkg/database"
)

// UserFinderUpdater is an interface to find and update User objects.
type UserFinder interface {
	Find(id uuid.UUID) (*User, error)
	FindByEmail(email string) (*User, error)
}

type UserFinderUpdater interface {
	UserFinder
	UpdateFull(updatedUser User) (*User, error)
}

type UserQueryBuilder struct {
	dbi database.DBI
}

func NewUserQueryBuilder(tx *sqlx.Tx) UserQueryBuilder {
	return UserQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *UserQueryBuilder) toModel(ro interface{}) *User {
	if ro != nil {
		return ro.(*User)
	}

	return nil
}

func (qb *UserQueryBuilder) Create(newUser User) (*User, error) {
	ret, err := qb.dbi.Insert(newUser)
	return qb.toModel(ret), err
}

func (qb *UserQueryBuilder) Update(updatedUser User) (*User, error) {
	ret, err := qb.dbi.Update(updatedUser, false)
	return qb.toModel(ret), err
}

func (qb *UserQueryBuilder) UpdateFull(updatedUser User) (*User, error) {
	ret, err := qb.dbi.Update(updatedUser, true)
	return qb.toModel(ret), err
}

func (qb *UserQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, userDBTable)
}

func (qb *UserQueryBuilder) CreateRoles(newJoins UserRoles) error {
	return qb.dbi.InsertJoins(userRolesTable, &newJoins)
}

func (qb *UserQueryBuilder) UpdateRoles(studioID uuid.UUID, updatedJoins UserRoles) error {
	return qb.dbi.ReplaceJoins(userRolesTable, studioID, &updatedJoins)
}

func (qb *UserQueryBuilder) Find(id uuid.UUID) (*User, error) {
	ret, err := qb.dbi.Find(id, userDBTable)
	return qb.toModel(ret), err
}

func (qb *UserQueryBuilder) FindByName(name string) (*User, error) {
	query := "SELECT * FROM users WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryUsers(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *UserQueryBuilder) FindByEmail(email string) (*User, error) {
	query := "SELECT * FROM users WHERE upper(email) = upper(?)"
	var args []interface{}
	args = append(args, email)
	results, err := qb.queryUsers(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *UserQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT users.id FROM users"), nil)
}

func (qb *UserQueryBuilder) Query(userFilter *UserFilterType, findFilter *QuerySpec) (Users, int) {
	if userFilter == nil {
		userFilter = &UserFilterType{}
	}
	if findFilter == nil {
		findFilter = &QuerySpec{}
	}

	query := database.NewQueryBuilder(userDBTable)

	if q := userFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"users.name", "users.email"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, false)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	query.SortAndPagination = qb.getUserSort(findFilter) + getPagination(findFilter)
	var studios Users
	countResult, err := qb.dbi.Query(*query, &studios)

	if err != nil {
		// TODO
		panic(err)
	}

	return studios, countResult
}

func (qb *UserQueryBuilder) getUserSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "users")
}

func (qb *UserQueryBuilder) queryUsers(query string, args []interface{}) (Users, error) {
	var output Users
	err := qb.dbi.RawQuery(userDBTable, query, args, &output)
	return output, err
}

func (qb *UserQueryBuilder) GetRoles(id uuid.UUID) (UserRoles, error) {
	joins := UserRoles{}
	err := qb.dbi.FindJoins(userRolesTable, id, &joins)

	return joins, err
}
