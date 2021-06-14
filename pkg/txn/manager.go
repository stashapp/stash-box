package txn

type Mgr interface {
	WithTxn(fn func() error) error
	InTxn() bool
}

func MustBeIn(m Mgr) {
	if !m.InTxn() {
		panic("not in transaction")
	}
}
