package utils

import (
	"os"
)

// FileExists returns true if the given path exists
func FileExists(path string) (bool, error) {
	_, err := os.Stat(path)
	switch {
	case err == nil:
		return true, nil
	case os.IsNotExist(err):
		return false, err
	default:
		panic(err)
	}
}

// Touch creates an empty file at the given path if it doesn't already exist
func Touch(path string) error {
	var _, err = os.Stat(path)
	if os.IsNotExist(err) {
		var file, err = os.Create(path)
		if err != nil {
			return err
		}
		return file.Close()
	}
	return nil
}
