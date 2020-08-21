package utils

func DuplicateError(err error, size int) []error {
	errors := make([]error, size)
	for i, _ := range errors {
		errors[i] = err
	}
	return errors
}
