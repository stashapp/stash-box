package sqlx

import "gopkg.in/guregu/null.v4"

func intPtrFromNullInt(n null.Int) *int {
	if n.Valid {
		i := int(n.Int64)
		return &i
	}
	return nil
}
