package queries

// DB returns the underlying DBTX interface from Queries
func (q *Queries) DB() DBTX {
	return q.db
}
