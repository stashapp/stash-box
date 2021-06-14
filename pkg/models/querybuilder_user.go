package models

import (
	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stashapp/stash-box/pkg/database"
)

type userQueryBuilder struct {
	dbi database.DBI
}

func NewUserQueryBuilder(tx *sqlx.Tx) UserRepo {
	return &userQueryBuilder{
		dbi: database.DBIWithTxn(tx),
	}
}

func (qb *userQueryBuilder) toModel(ro interface{}) *User {
	if ro != nil {
		return ro.(*User)
	}

	return nil
}

func (qb *userQueryBuilder) Create(newUser User) (*User, error) {
	ret, err := qb.dbi.Insert(newUser)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) Update(updatedUser User) (*User, error) {
	ret, err := qb.dbi.Update(updatedUser, false)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) UpdateFull(updatedUser User) (*User, error) {
	ret, err := qb.dbi.Update(updatedUser, true)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, userDBTable)
}

func (qb *userQueryBuilder) CreateRoles(newJoins UserRoles) error {
	return qb.dbi.InsertJoins(userRolesTable, &newJoins)
}

func (qb *userQueryBuilder) UpdateRoles(studioID uuid.UUID, updatedJoins UserRoles) error {
	return qb.dbi.ReplaceJoins(userRolesTable, studioID, &updatedJoins)
}

func (qb *userQueryBuilder) Find(id uuid.UUID) (*User, error) {
	ret, err := qb.dbi.Find(id, userDBTable)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) FindByName(name string) (*User, error) {
	query := "SELECT * FROM users WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryUsers(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *userQueryBuilder) FindByEmail(email string) (*User, error) {
	query := "SELECT * FROM users WHERE upper(email) = upper(?)"
	var args []interface{}
	args = append(args, email)
	results, err := qb.queryUsers(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *userQueryBuilder) Count() (int, error) {
	return runCountQuery(buildCountQuery("SELECT users.id FROM users"), nil)
}

func (qb *userQueryBuilder) Query(userFilter *UserFilterType, findFilter *QuerySpec) (Users, int) {
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

func (qb *userQueryBuilder) getUserSort(findFilter *QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(sort, direction, "users", nil)
}

func (qb *userQueryBuilder) queryUsers(query string, args []interface{}) (Users, error) {
	var output Users
	err := qb.dbi.RawQuery(userDBTable, query, args, &output)
	return output, err
}

func (qb *userQueryBuilder) GetRoles(id uuid.UUID) (UserRoles, error) {
	joins := UserRoles{}
	err := qb.dbi.FindJoins(userRolesTable, id, &joins)

	return joins, err
}
