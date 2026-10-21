package utils

import "uuid"

// UUIDOrNil returns the Nil UUID when s does not parse.
func UUIDOrNil(s string) uuid.UUID {
	u, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil()
	}
	return u
}
