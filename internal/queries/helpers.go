package queries

func QueryIDs(ids []string) []string {
	res := make([]string, 0, len(ids))
	res = append(res, ids...)
	return res
}

// DB returns the underlying DBTX interface from Queries
func (q *Queries) DB() DBTX {
	return q.db
}
