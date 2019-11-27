package database

// NewObjectFunc is a function that returns an instance of an object stored in
// a database table.
type NewObjectFunc func() interface{}

// Table represents a database table.
type Table struct {
	name        string
	newObjectFn NewObjectFunc
}

// Name returns the name of the database table.
func (t Table) Name() string {
	return t.name
}

// NewObject returns a new object model of the type that this table stores.
func (t Table) NewObject() interface{} {
	return t.newObjectFn()
}

// NewTable creates a new Table object with the provided table name and new
// object function.
func NewTable(name string, newObjectFn NewObjectFunc) Table {
	return Table{
		name:        name,
		newObjectFn: newObjectFn,
	}
}

// TableJoin represents a database Table that joins two other tables.
type TableJoin struct {
	Table

	// the primary table that will be joined to this table
	primaryTable string

	// the column in this table that stores the foreign key to the primary table.
	joinColumn string
}

// Creates a new TableJoin instance. The primaryTable is the table that will join
// to the join table. The joinColumn is the name in the join table that stores
// the foreign key in the primary table.
func NewTableJoin(primaryTable string, name string, joinColumn string, newObjectFn func() interface{}) TableJoin {
	return TableJoin{
		Table: Table{
			name:        name,
			newObjectFn: newObjectFn,
		},
		primaryTable: primaryTable,
		joinColumn:   joinColumn,
	}
}

// Inverse creates a TableJoin object that is the inverse of this table join.
// The returns TableJoin object will have this table as the primary table.
func (t TableJoin) Inverse(joinColumn string) TableJoin {
	return TableJoin{
		Table: Table{
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
	// GetTable returns the table that stores objects of this type.
	GetTable() Table

	// GetID returns the ID of the object.
	GetID() int64
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
