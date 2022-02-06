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

func (qb *userQueryBuilder) UpdateRoles(userID uuid.UUID, updatedJoins models.UserRoles) error {
	return qb.dbi.ReplaceJoins(userRolesTable, userID, &updatedJoins)
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

func (qb *userQueryBuilder) Query(filter models.UserQueryInput) (models.Users, int, error) {
	query := newQueryBuilder(userDBTable)

	if q := filter.Name; q != nil && *q != "" {
		searchColumns := []string{"users.name", "users.email"}
		clause, thisArgs := getSearchBinding(searchColumns, *q, false, true)
		query.AddWhere(clause)
		query.AddArg(thisArgs...)
	}

	query.Sort = getSort("name", "ASC", "users", nil)
	query.Pagination = getPagination(filter.Page, filter.PerPage)

	var studios models.Users
	countResult, err := qb.dbi.Query(*query, &studios)

	return studios, countResult, err
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

func (qb *userQueryBuilder) CountEditsByStatus(id uuid.UUID) (*models.UserEditCount, error) {
	rows, err := qb.dbi.queryx("SELECT status, COUNT(*) FROM edits WHERE user_id = ? GROUP BY status", id)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = rows.Close()
	}()

	var res models.UserEditCount
	for rows.Next() {
		var status models.VoteStatusEnum
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}

		switch status {
		case models.VoteStatusEnumAccepted:
			res.Accepted = count
		case models.VoteStatusEnumRejected:
			res.Rejected = count
		case models.VoteStatusEnumImmediateAccepted:
			res.ImmediateAccepted = count
		case models.VoteStatusEnumImmediateRejected:
			res.ImmediateRejected = count
		case models.VoteStatusEnumPending:
			res.Pending = count
		case models.VoteStatusEnumFailed:
			res.Failed = count
		case models.VoteStatusEnumCanceled:
			res.Canceled = count
		}
	}

	return &res, nil
}

func (qb *userQueryBuilder) CountVotesByType(id uuid.UUID) (*models.UserVoteCount, error) {
	rows, err := qb.dbi.queryx("SELECT vote, COUNT(*) FROM edit_votes WHERE user_id = ? GROUP BY vote", id)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = rows.Close()
	}()

	var res models.UserVoteCount
	for rows.Next() {
		var status models.VoteTypeEnum
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, err
		}

		switch status {
		case models.VoteTypeEnumAccept:
			res.Accept = count
		case models.VoteTypeEnumReject:
			res.Reject = count
		case models.VoteTypeEnumAbstain:
			res.Abstain = count
		case models.VoteTypeEnumImmediateAccept:
			res.ImmediateAccept = count
		case models.VoteTypeEnumImmediateReject:
			res.ImmediateReject = count
		}
	}

	return &res, nil
}
