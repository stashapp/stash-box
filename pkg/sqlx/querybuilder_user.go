package sqlx

import (
	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/pkg/models"
)

const (
	userTable   = "users"
	userJoinKey = "user_id"
)

var (
	userDBTable = newTable(userTable, func() interface{} {
		return &models.User{}
	})

	userRolesTable = newTableJoin(userTable, "user_roles", userJoinKey, func() interface{} {
		return &models.UserRole{}
	})
)

type userQueryBuilder struct {
	dbi *dbi
}

func newUserQueryBuilder(txn *txnState) models.UserRepo {
	return &userQueryBuilder{
		dbi: newDBI(txn),
	}
}

func (qb *userQueryBuilder) toModel(ro interface{}) *models.User {
	if ro != nil {
		return ro.(*models.User)
	}

	return nil
}

func (qb *userQueryBuilder) Create(newUser models.User) (*models.User, error) {
	ret, err := qb.dbi.Insert(userDBTable, newUser)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) Update(updatedUser models.User) (*models.User, error) {
	ret, err := qb.dbi.Update(userDBTable, updatedUser, false)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) UpdateFull(updatedUser models.User) (*models.User, error) {
	ret, err := qb.dbi.Update(userDBTable, updatedUser, true)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) Destroy(id uuid.UUID) error {
	return qb.dbi.Delete(id, userDBTable)
}

func (qb *userQueryBuilder) CreateRoles(newJoins models.UserRoles) error {
	return qb.dbi.InsertJoins(userRolesTable, &newJoins)
}

func (qb *userQueryBuilder) UpdateRoles(studioID uuid.UUID, updatedJoins models.UserRoles) error {
	return qb.dbi.ReplaceJoins(userRolesTable, studioID, &updatedJoins)
}

func (qb *userQueryBuilder) Find(id uuid.UUID) (*models.User, error) {
	ret, err := qb.dbi.Find(id, userDBTable)
	return qb.toModel(ret), err
}

func (qb *userQueryBuilder) FindByName(name string) (*models.User, error) {
	query := "SELECT * FROM users WHERE upper(name) = upper(?)"
	var args []interface{}
	args = append(args, name)
	results, err := qb.queryUsers(query, args)
	if err != nil || len(results) < 1 {
		return nil, err
	}
	return results[0], nil
}

func (qb *userQueryBuilder) FindByEmail(email string) (*models.User, error) {
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
	return runCountQuery(qb.dbi.db(), buildCountQuery("SELECT users.id FROM users"), nil)
}

func (qb *userQueryBuilder) Query(userFilter *models.UserFilterType, findFilter *models.QuerySpec) (models.Users, int) {
	if userFilter == nil {
		userFilter = &models.UserFilterType{}
	}
	if findFilter == nil {
		findFilter = &models.QuerySpec{}
	}

	query := newQueryBuilder(userDBTable)

	if q := userFilter.Name; q != nil && *q != "" {
		searchColumns := []string{"users.name", "users.email"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	query.SortAndPagination = qb.getUserSort(findFilter) + getPagination(findFilter)
	var studios models.Users
	countResult, err := qb.dbi.Query(*query, &studios)

	if err != nil {
		// TODO
		panic(err)
	}

	return studios, countResult
}

func (qb *userQueryBuilder) getUserSort(findFilter *models.QuerySpec) string {
	var sort string
	var direction string
	if findFilter == nil {
		sort = "name"
		direction = "ASC"
	} else {
		sort = findFilter.GetSort("name")
		direction = findFilter.GetDirection()
	}
	return getSort(qb.dbi.txn.dialect, sort, direction, "users", nil)
}

func (qb *userQueryBuilder) queryUsers(query string, args []interface{}) (models.Users, error) {
	var output models.Users
	err := qb.dbi.RawQuery(userDBTable, query, args, &output)
	return output, err
}

func (qb *userQueryBuilder) GetRoles(id uuid.UUID) (models.UserRoles, error) {
	joins := models.UserRoles{}
	err := qb.dbi.FindJoins(userRolesTable, id, &joins)

	return joins, err
}
