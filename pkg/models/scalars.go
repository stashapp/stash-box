package models

import (
	"fmt"
	"io"
	"strings"

	"github.com/99designs/gqlgen/graphql"
	"github.com/gofrs/uuid"
)

type ID uuid.UUID

// Creates a marshaller which converts a uuid to a string
func MarshalID(id uuid.UUID) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		_, e := io.WriteString(w, fmt.Sprintf("%s%s%s", "\"", id.String(), "\""))
		if e != nil {
			panic(e)
		}
	})
}

// Unmarshalls a string to a uuid
func UnmarshalID(v interface{}) (uuid.UUID, error) {
	str, ok := v.(string)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("ids must be strings")
	}
	withoutQuotes := strings.ReplaceAll(str, "\"", "")
	i, err := uuid.FromString(withoutQuotes)
	return i, err
}
