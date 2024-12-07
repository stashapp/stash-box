package sqlx

import "database/sql"

func intPtrFromNullInt(n sql.NullInt64) *int {
	if n.Valid {
		i := int(n.Int64)
		return &i
	}
	return nil
}
