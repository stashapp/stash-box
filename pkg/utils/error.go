package utils

func DuplicateError(err error, size int) []error {
	errors := make([]error, size)
	for i := range errors {
		errors[i] = err
	}
	return errors
}
