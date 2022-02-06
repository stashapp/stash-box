package txn

// Mgr manages the initialisation of transaction state objects.
// Mgr instances may exist in multiple goroutines.
type Mgr interface {
	// New creates a new State object, for the purposes of executing
	// queries within a single context.
	New() State
}

// State represents the transaction state for a single request.
// A State object instance should exist only within a single goroutine.
// It MUST NOT be shared between goroutines.
type State interface {
	WithTxn(fn func() error) error
	InTxn() bool
	ResetTxn() error
}

func MustBeIn(m State) {
	if !m.InTxn() {
		panic("not in transaction")
	}
}
