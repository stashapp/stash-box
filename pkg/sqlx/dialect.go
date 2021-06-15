package sqlx

type Dialect interface {
	FieldQuote(field string) string
	NullsLast() string
}
