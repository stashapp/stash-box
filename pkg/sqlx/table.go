package sqlx

import (
	"github.com/gofrs/uuid"
)

// newObjectFunc is a function that returns an instance of an object stored in
// a database table.
type newObjectFunc func() interface{}

// table represents a database table.
type table struct {
	name        string
	newObjectFn newObjectFunc
}

// Name returns the name of the database table.
func (t table) Name() string {
	return t.name
}

// NewObject returns a new object model of the type that this table stores.
func (t table) NewObject() interface{} {
	return t.newObjectFn()
}

// newTable creates a new Table object with the provided table name and new
// object function.
func newTable(name string, newObjectFn newObjectFunc) table {
	return table{
		name:        name,
		newObjectFn: newObjectFn,
	}
}

// tableJoin represents a database Table that joins two other tables.
type tableJoin struct {
	table

	// the primary table that will be joined to this table
	primaryTable string

	// the column in this table that stores the foreign key to the primary table.
	joinColumn string
}

// Creates a new TableJoin instance. The primaryTable is the table that will join
// to the join table. The joinColumn is the name in the join table that stores
// the foreign key in the primary table.
func newTableJoin(primaryTable string, name string, joinColumn string, newObjectFn func() interface{}) tableJoin {
	return tableJoin{
		table: table{
			name:        name,
			newObjectFn: newObjectFn,
		},
		primaryTable: primaryTable,
		joinColumn:   joinColumn,
	}
}

// Inverse creates a TableJoin object that is the inverse of this table join.
// The returns TableJoin object will have this table as the primary table.
func (t tableJoin) Inverse(joinColumn string) tableJoin {
	return tableJoin{
		table: table{
			name:        t.primaryTable,
			newObjectFn: t.newObjectFn,
		},
		primaryTable: t.Name(),
		joinColumn:   joinColumn,
	}
}

// Model is the interface implemented by objects that exist in the database
// that have an `id` column.
type Model interface {
	// GetID returns the ID of the object.
	GetID() uuid.UUID
}

// Models is the interface implemented by slices of Model objects.
type Models interface {
	// Add adds a new object to the slice. It is assumed that the passed
	// object can be type asserted to the correct type.
	Add(interface{})
}

// Joins is the interface implemented by slices of join objects.
type Joins interface {
	// Each calls the provided function on each of the concrete (not pointer)
	// objects in the slice.
	Each(func(interface{}))

	// Add adds a new object to the slice. It is assumed that the passed
	// object can be type asserted to the correct type.
	Add(interface{})
}
