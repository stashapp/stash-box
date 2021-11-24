package sqlx

import (
	"database/sql"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
)

type dbi struct {
	txn *txnState
}

// DBI returns a DBI interface.
func newDBI(txn *txnState) *dbi {
	return &dbi{
		txn: txn,
	}
}

func (q dbi) db() db {
	return q.txn.DB()
}

// Insert inserts the provided object as a row into the database.
// It returns the new object.
func (q dbi) Insert(t table, model Model) (interface{}, error) {
	tableName := t.Name()
	err := insertObject(q.txn, tableName, model, nil)

	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error creating %s", reflect.TypeOf(model).Name()))
	}

	// don't want to modify the existing object
	newModel := t.NewObject()
	if err := getByID(q.txn, tableName, model.GetID(), newModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after create", reflect.TypeOf(model).Name()))
	}

	return newModel, nil
}

// Update updates a database row based on the id and values of the provided
// object. It returns the updated object. Update will return an error if
// the object with id does not exist in the database table.
func (q dbi) Update(t table, model Model, updateEmptyValues bool) (interface{}, error) {
	tableName := t.Name()
	err := updateObjectByID(q.txn, tableName, model, updateEmptyValues)

	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error updating %s", reflect.TypeOf(model).Name()))
	}

	// don't want to modify the existing object
	updatedModel := t.NewObject()
	if err := getByID(q.txn, tableName, model.GetID(), updatedModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after update", reflect.TypeOf(model).Name()))
	}

	return updatedModel, nil
}

// Delete deletes the table row with the provided id. Delete returns an
// error if the id does not exist in the database table.
func (q dbi) Delete(id uuid.UUID, t table) error {
	o, err := q.Find(id, t)

	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Error deleting from %s", t.Name()))
	}

	if o == nil {
		return fmt.Errorf("Row with id %d not found in %s", id, t.Name())
	}

	return executeDeleteQuery(t.Name(), id, q.txn)
}

// Soft delete row by setting value of deleted column to TRUE
func (q dbi) SoftDelete(t table, model Model) (interface{}, error) {
	tableName := t.Name()
	id := model.GetID()

	err := softDeleteObjectByID(q.txn, tableName, id)
	if err != nil {
		return nil, err
	}

	// don't want to modify the existing object
	updatedModel := t.NewObject()
	if err := getByID(q.txn, tableName, id, updatedModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after soft delete", reflect.TypeOf(model).Name()))
	}

	return updatedModel, nil
}

func selectStatement(t table) string {
	tableName := t.Name()
	return fmt.Sprintf("SELECT %s.* FROM %s", tableName, tableName)
}

func (q dbi) queryx(query string, args ...interface{}) (*sqlx.Rows, error) {
	query = q.db().Rebind(query)
	return q.db().Queryx(query, args...)
}

func (q dbi) queryFunc(query string, args []interface{}, f func(rows *sqlx.Rows) error) error {
	rows, err := q.queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		// TODO - log error instead of returning SQL
		err = errors.Wrap(err, fmt.Sprintf("Error executing query: %s, with args: %v", query, args))
		return err
	}
	defer func() {
		_ = rows.Close()
	}()

	for rows.Next() {
		if err := f(rows); err != nil {
			return err
		}
	}

	return rows.Err()
}

// Find returns the row object with the provided id, or returns nil if not
// found.
func (q dbi) Find(id uuid.UUID, t table) (interface{}, error) {
	query := selectStatement(t) + " WHERE id = ? LIMIT 1"
	args := []interface{}{id}

	var output interface{}

	// just get the first row
	if err := q.queryFunc(query, args, func(rows *sqlx.Rows) error {
		output = t.NewObject()
		if err := rows.StructScan(output); err != nil {
			return err
		}

		return rows.Close()
	}); err != nil {
		return nil, err
	}

	return output, nil
}

// InsertJoin inserts a join object into the provided join table.
func (q dbi) InsertJoin(tj tableJoin, object interface{}, conflictHandling *string) error {
	err := insertObject(q.txn, tj.Name(), object, conflictHandling)

	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Error creating %s", reflect.TypeOf(object).Name()))
	}

	return nil
}

// InsertJoins inserts multiple join objects into the provided join table.
func (q dbi) InsertJoins(tj tableJoin, joins Joins) error {
	var err error
	joins.Each(func(ro interface{}) {
		if err != nil {
			return
		}

		err = q.InsertJoin(tj, ro, nil)
	})

	return err
}

// InsertJoinsWithConflictHandling inserts multiple join objects and adds a conflict clause
func (q dbi) InsertJoinsWithConflictHandling(tj tableJoin, joins Joins, conflictHandling string) error {
	var err error
	joins.Each(func(ro interface{}) {
		if err != nil {
			return
		}

		err = q.InsertJoin(tj, ro, &conflictHandling)
	})

	return err
}

// ReplaceJoins replaces table join objects with the provided primary table
// id value with the provided join objects.
func (q dbi) ReplaceJoins(tj tableJoin, id uuid.UUID, joins Joins) error {
	err := q.DeleteJoins(tj, id)

	if err != nil {
		return err
	}

	return q.InsertJoins(tj, joins)
}

// DeleteJoins deletes all join objects with the provided primary table
// id value.
func (q dbi) DeleteJoins(tj tableJoin, id uuid.UUID) error {
	return deleteObjectsByColumn(q.txn, tj.Name(), tj.joinColumn, id)
}

// FindJoins returns join objects where the foreign key id is equal to the
// provided id. The join objects are output to the provided output slice.
func (q dbi) FindJoins(tj tableJoin, id uuid.UUID, output Joins) error {
	query := selectStatement(tj.table) + " WHERE " + tj.joinColumn + " = ?"
	args := []interface{}{id}

	return q.RawQuery(tj.table, query, args, output)
}

// FindAllJoins returns join objects where the foreign key id is equal to one of the
// provided ids. The join objects are output to the provided output slice.
func (q dbi) FindAllJoins(tj tableJoin, ids []uuid.UUID, output Joins) error {
	query := selectStatement(tj.table) + " WHERE " + tj.joinColumn + " IN (?)"
	query, args, _ := sqlx.In(query, ids)

	return q.RawQuery(tj.table, query, args, output)
}

// RawQuery performs a query on the provided table using the query string
// and argument slice. It outputs the results to the output slice.
func (q dbi) RawQuery(t table, query string, args []interface{}, output Models) error {
	return q.queryFunc(query, args, func(rows *sqlx.Rows) error {
		o := t.NewObject()
		if err := rows.StructScan(o); err != nil {
			return err
		}

		output.Add(o)
		return nil
	})
}

// RawExec performs a query on the provided table using the query string
// and argument slice.
func (q dbi) RawExec(query string, args []interface{}) error {
	var rows *sqlx.Rows
	var err error

	rows, err = q.queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		// TODO - log error instead of returning SQL
		err = errors.Wrap(err, fmt.Sprintf("Error executing query: %s, with args: %v", query, args))
		return err
	}
	defer func() {
		_ = rows.Close()
	}()

	return rows.Err()
}

// Count performs a count query using the provided query builder
func (q dbi) Count(query queryBuilder) (int, error) {
	var err error

	result := struct {
		Int int `db:"count"`
	}{0}

	rawQuery := query.buildCountQuery()

	rawQuery = q.db().Rebind(rawQuery)
	err = q.db().Get(&result, rawQuery, query.args...)

	if err != nil && err != sql.ErrNoRows {
		// TODO - log error instead of returning SQL
		err = errors.Wrap(err, fmt.Sprintf("Error executing query: %s, with args: %v", rawQuery, query.args))
		return 0, err
	}

	return result.Int, nil
}

// RawQuery performs a query on the provided table using the query string
// and argument slice. It outputs the results to the output slice.
func (q dbi) Query(query queryBuilder, output Models) (int, error) {

	count, err := q.Count(query)

	if err != nil {
		return 0, err
	}

	err = q.RawQuery(query.Table, query.buildQuery(), query.args, output)

	return count, err
}

func (q dbi) CountOnly(query queryBuilder) (int, error) {
	return q.Count(query)
}

func (q dbi) QueryOnly(query queryBuilder, output Models) error {
	return q.RawQuery(query.Table, query.buildQuery(), query.args, output)
}

// DeleteQuery deletes table rows that match the query provided.
func (q dbi) DeleteQuery(query queryBuilder) error {
	ensureTx(q.txn)
	queryStr := q.db().Rebind(query.buildQuery())
	_, err := q.db().Exec(queryStr, query.args...)
	return err
}
