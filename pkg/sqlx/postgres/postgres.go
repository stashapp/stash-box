package postgres

type Dialect struct{}

func (*Dialect) FieldQuote(field string) string {
	return `"` + field + `"`
}

func (*Dialect) NullsLast() string {
	return " NULLS LAST "
}
