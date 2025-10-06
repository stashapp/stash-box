package queries

// WithTxnFunc is a function type for handling transactions
// The function receives a *Queries object initialized with the transaction
type WithTxnFunc func(func(*Queries) error) error

// Service interface that all services should implement
type Service interface {
	WithTxn(func(*Queries) error) error
}
