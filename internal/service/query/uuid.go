package query

import (
	"database/sql/driver"
	"uuid"

	sq "github.com/Masterminds/squirrel"
)

// UUIDArg adapts a UUID for squirrel, which expands a bare [16]byte into one
// placeholder per byte unless the value implements driver.Valuer.
type UUIDArg uuid.UUID

func (u UUIDArg) Value() (driver.Value, error) {
	b := uuid.UUID(u)
	return b[:], nil
}

// EqUUID matches a UUID column. Prefer it over a bare sq.Eq, which would
// expand the UUID into sixteen placeholders.
func EqUUID(column string, id uuid.UUID) sq.Eq {
	return sq.Eq{column: UUIDArg(id)}
}

// NotEqUUID excludes a UUID column. See EqUUID.
func NotEqUUID(column string, id uuid.UUID) sq.NotEq {
	return sq.NotEq{column: UUIDArg(id)}
}
