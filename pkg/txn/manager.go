package txn

type State interface {
	WithTxn(fn func() error) error
	InTxn() bool
}

func MustBeIn(m State) {
	if !m.InTxn() {
		panic("not in transaction")
	}
}
