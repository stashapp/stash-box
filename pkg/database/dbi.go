package database

import (
	"database/sql"
	"fmt"
	"reflect"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/pkg/errors"
)

// The DBI interface is used to interface with the database.
type DBI interface {
	// Insert inserts the provided object as a row into the database.
	// It returns the new object.
	Insert(model Model) (interface{}, error)

	// InsertJoin inserts a join object into the provided join table.
	InsertJoin(tableJoin TableJoin, object interface{}, ignoreConflicts bool) error

	// InsertJoins inserts multiple join objects into the provided join table.
	InsertJoins(tableJoin TableJoin, joins Joins) error

	// InsertJoinsWithoutConflict inserts multiple join objects and doesn't fail on id conflicts
	InsertJoinsWithoutConflict(tableJoin TableJoin, joins Joins) error

	// Update updates a database row based on the id and values of the provided
	// object. It returns the updated object. Update will return an error if
	// the object with id does not exist in the database table.
	Update(model Model, updateEmptyValues bool) (interface{}, error)

	// ReplaceJoins replaces table join objects with the provided primary table
	// id value with the provided join objects.
	ReplaceJoins(tableJoin TableJoin, id uuid.UUID, objects Joins) error

	// Delete deletes the table row with the provided id. Delete returns an
	// error if the id does not exist in the database table.
	Delete(id uuid.UUID, table Table) error

	// DeleteJoins deletes all join objects with the provided primary table
	// id value.
	DeleteJoins(tableJoin TableJoin, id uuid.UUID) error

	// Soft delete row by setting value of deleted column to TRUE
	SoftDelete(model Model) (interface{}, error)

	// DeleteQuery deletes table rows that match the query provided.
	DeleteQuery(query QueryBuilder) error

	// Find returns the row object with the provided id, or returns nil if not
	// found.
	Find(id uuid.UUID, table Table) (interface{}, error)

	// FindJoins returns join objects where the foreign key id is equal to the
	// provided id. The join objects are output to the provided output slice.
	FindJoins(tableJoin TableJoin, id uuid.UUID, output Joins) error

	// FindAllJoins returns join objects where the foreign key id is equal to the
	// provided ids. The join objects are output to the provided output slice.
	FindAllJoins(tableJoin TableJoin, ids []uuid.UUID, output Joins) error

	// RawQuery performs a query on the provided table using the query string
	// and argument slice. It outputs the results to the output slice.
	RawQuery(table Table, query string, args []interface{}, output Models) error

	// Count performs a count query using the provided query builder
	Count(query QueryBuilder) (int, error)

	// Query performs a query using the provided query builder.
	Query(query QueryBuilder, output Models) (int, error)
}

type dbi struct {
	tx *sqlx.Tx
}

// DBIWithTxn returns a DBI interface that is to operate within a transaction.
func DBIWithTxn(tx *sqlx.Tx) DBI {
	return &dbi{
		tx: tx,
	}
}

// DBINoTxn returns a DBI interface that is to operate outside of a transaction.
// This DBI will not be able to mutate the database.
func DBINoTxn() DBI {
	return &dbi{}
}

// Insert inserts the provided object as a row into the database.
// It returns the new object.
func (q dbi) Insert(model Model) (interface{}, error) {
	tableName := model.GetTable().Name()
	err := insertObject(q.tx, tableName, model, false)

	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error creating %s", reflect.TypeOf(model).Name()))
	}

	// don't want to modify the existing object
	newModel := model.GetTable().NewObject()
	if err := getByID(q.tx, tableName, model.GetID(), newModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after create", reflect.TypeOf(model).Name()))
	}

	return newModel, nil
}

// Update updates a database row based on the id and values of the provided
// object. It returns the updated object. Update will return an error if
// the object with id does not exist in the database table.
func (q dbi) Update(model Model, updateEmptyValues bool) (interface{}, error) {
	tableName := model.GetTable().Name()
	err := updateObjectByID(q.tx, tableName, model, updateEmptyValues)

	if err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error updating %s", reflect.TypeOf(model).Name()))
	}

	// don't want to modify the existing object
	updatedModel := model.GetTable().NewObject()
	if err := getByID(q.tx, tableName, model.GetID(), updatedModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after update", reflect.TypeOf(model).Name()))
	}

	return updatedModel, nil
}

// Delete deletes the table row with the provided id. Delete returns an
// error if the id does not exist in the database table.
func (q dbi) Delete(id uuid.UUID, table Table) error {
	o, err := q.Find(id, table)

	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Error deleting from %s", table.Name()))
	}

	if o == nil {
		return fmt.Errorf("Row with id %d not found in %s", id, table.Name())
	}

	return executeDeleteQuery(table.Name(), id, q.tx)
}

// Soft delete row by setting value of deleted column to TRUE
func (q dbi) SoftDelete(model Model) (interface{}, error) {
	tableName := model.GetTable().Name()
	id := model.GetID()

	err := softDeleteObjectByID(q.tx, tableName, id)
	if err != nil {
		return nil, err
	}

	// don't want to modify the existing object
	updatedModel := model.GetTable().NewObject()
	if err := getByID(q.tx, tableName, id, updatedModel); err != nil {
		return nil, errors.Wrap(err, fmt.Sprintf("Error getting %s after soft delete", reflect.TypeOf(model).Name()))
	}

	return updatedModel, nil
}

func selectStatement(table Table) string {
	tableName := table.Name()
	return fmt.Sprintf("SELECT %s.* FROM %s", tableName, tableName)
}

func (q dbi) queryx(query string, args ...interface{}) (*sqlx.Rows, error) {
	if q.tx != nil {
		query = q.tx.Rebind(query)
		return q.tx.Queryx(query, args...)
	} else {
		query = DB.Rebind(query)
		return DB.Queryx(query, args...)
	}
}

// Find returns the row object with the provided id, or returns nil if not
// found.
func (q dbi) Find(id uuid.UUID, table Table) (interface{}, error) {
	query := selectStatement(table) + " WHERE id = ? LIMIT 1"
	args := []interface{}{id}

	var rows *sqlx.Rows
	var err error
	rows, err = q.queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	defer rows.Close()

	output := table.NewObject()
	if rows.Next() {
		if err := rows.StructScan(output); err != nil {
			return nil, err
		}
	} else {
		// not found
		return nil, nil
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return output, nil
}

// InsertJoin inserts a join object into the provided join table.
func (q dbi) InsertJoin(tableJoin TableJoin, object interface{}, ignoreConflicts bool) error {
	err := insertObject(q.tx, tableJoin.Name(), object, ignoreConflicts)

	if err != nil {
		return errors.Wrap(err, fmt.Sprintf("Error creating %s", reflect.TypeOf(object).Name()))
	}

	return nil
}

// InsertJoins inserts multiple join objects into the provided join table.
func (q dbi) InsertJoins(tableJoin TableJoin, joins Joins) error {
	var err error
	joins.Each(func(ro interface{}) {
		if err != nil {
			return
		}

		err = q.InsertJoin(tableJoin, ro, false)
	})

	return err
}

// InsertJoinsWithoutConflict inserts multiple join objects and doesn't fail on id conflicts
func (q dbi) InsertJoinsWithoutConflict(tableJoin TableJoin, joins Joins) error {
	var err error
	joins.Each(func(ro interface{}) {
		if err != nil {
			return
		}

		err = q.InsertJoin(tableJoin, ro, true)
	})

	return err
}

// ReplaceJoins replaces table join objects with the provided primary table
// id value with the provided join objects.
func (q dbi) ReplaceJoins(tableJoin TableJoin, id uuid.UUID, joins Joins) error {
	err := q.DeleteJoins(tableJoin, id)

	if err != nil {
		return err
	}

	return q.InsertJoins(tableJoin, joins)
}

// DeleteJoins deletes all join objects with the provided primary table
// id value.
func (q dbi) DeleteJoins(tableJoin TableJoin, id uuid.UUID) error {
	return deleteObjectsByColumn(q.tx, tableJoin.Name(), tableJoin.joinColumn, id)
}

// FindJoins returns join objects where the foreign key id is equal to the
// provided id. The join objects are output to the provided output slice.
func (q dbi) FindJoins(tableJoin TableJoin, id uuid.UUID, output Joins) error {
	query := selectStatement(tableJoin.Table) + " WHERE " + tableJoin.joinColumn + " = ?"
	args := []interface{}{id}

	return q.RawQuery(tableJoin.Table, query, args, output)
}

// FindAllJoins returns join objects where the foreign key id is equal to one of the
// provided ids. The join objects are output to the provided output slice.
func (q dbi) FindAllJoins(tableJoin TableJoin, ids []uuid.UUID, output Joins) error {
	query := selectStatement(tableJoin.Table) + " WHERE " + tableJoin.joinColumn + " IN (?)"
	query, args, _ := sqlx.In(query, ids)

	return q.RawQuery(tableJoin.Table, query, args, output)
}

// RawQuery performs a query on the provided table using the query string
// and argument slice. It outputs the results to the output slice.
func (q dbi) RawQuery(table Table, query string, args []interface{}, output Models) error {
	var rows *sqlx.Rows
	var err error

	rows, err = q.queryx(query, args...)

	if err != nil && err != sql.ErrNoRows {
		// TODO - log error instead of returning SQL
		err = errors.Wrap(err, fmt.Sprintf("Error executing query: %s, with args: %v", query, args))
		return err
	}
	defer rows.Close()

	for rows.Next() {
		o := table.NewObject()
		if err := rows.StructScan(o); err != nil {
			return err
		}

		output.Add(o)
	}

	if err := rows.Err(); err != nil {
		return err
	}

	return nil
}

func (q dbi) Count(query QueryBuilder) (int, error) {
	var err error

	result := struct {
		Int int `db:"count"`
	}{0}

	rawQuery := query.buildCountQuery()

	if q.tx != nil {
		rawQuery = q.tx.Rebind(rawQuery)
		err = q.tx.Get(&result, rawQuery, query.args...)
	} else {
		rawQuery = DB.Rebind(rawQuery)
		err = DB.Get(&result, rawQuery, query.args...)
	}

	if err != nil && err != sql.ErrNoRows {
		// TODO - log error instead of returning SQL
		err = errors.Wrap(err, fmt.Sprintf("Error executing query: %s, with args: %v", rawQuery, query.args))
		return 0, err
	}

	return result.Int, nil
}

// RawQuery performs a query on the provided table using the query string
// and argument slice. It outputs the results to the output slice.
func (q dbi) Query(query QueryBuilder, output Models) (int, error) {

	count, err := q.Count(query)

	if err != nil {
		return 0, err
	}

	err = q.RawQuery(query.Table, query.buildQuery(), query.args, output)

	return count, err
}

func (q dbi) DeleteQuery(query QueryBuilder) error {
	ensureTx(q.tx)
	queryStr := q.tx.Rebind(query.buildQuery())
	_, err := q.tx.Exec(queryStr, query.args...)
	return err
}
