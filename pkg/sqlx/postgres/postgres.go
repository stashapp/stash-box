package postgres

// Dialect is a dialect implementation for postgres.
type Dialect struct{}

func (*Dialect) FieldQuote(field string) string {
	return `"` + field + `"`
}

func (*Dialect) NullsLast() string {
	return " NULLS LAST "
}
