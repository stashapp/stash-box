package models

import (
	"fmt"
	"io"
	"strconv"
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
func UnmarshalID(v any) (uuid.UUID, error) {
	str, ok := v.(string)
	if !ok {
		return uuid.UUID{}, fmt.Errorf("ids must be strings")
	}
	withoutQuotes := strings.ReplaceAll(str, "\"", "")
	i, err := uuid.FromString(withoutQuotes)
	return i, err
}

// FingerprintHash stores fingerprint hashes as int64 internally
// but serializes as hex string
type FingerprintHash int64

func (h FingerprintHash) Int64() int64 {
	return int64(h)
}

// Hex returns the hash as a 16-character zero-padded hex string
func (h FingerprintHash) Hex() string {
	return fmt.Sprintf("%016x", uint64(h))
}

// MarshalJSON serializes as hex string for JSONB storage compatibility
func (h FingerprintHash) MarshalJSON() ([]byte, error) {
	return fmt.Appendf(nil, "\"%016x\"", uint64(h)), nil
}

// UnmarshalJSON deserializes from hex string
func (h *FingerprintHash) UnmarshalJSON(data []byte) error {
	str := strings.Trim(string(data), "\"")
	hashUint, err := strconv.ParseUint(str, 16, 64)
	if err != nil {
		return fmt.Errorf("invalid fingerprint hash: %w", err)
	}
	*h = FingerprintHash(int64(hashUint))
	return nil
}

// MarshalFingerprintHash converts int64 to hex string for GraphQL output
func MarshalFingerprintHash(h FingerprintHash) graphql.Marshaler {
	return graphql.WriterFunc(func(w io.Writer) {
		_, e := io.WriteString(w, fmt.Sprintf("\"%016x\"", uint64(h)))
		if e != nil {
			panic(e)
		}
	})
}

// UnmarshalFingerprintHash converts hex string from clients to int64.
// Returns 0 for oversized hashes (e.g. MD5)
func UnmarshalFingerprintHash(v any) (FingerprintHash, error) {
	str, ok := v.(string)
	if !ok {
		return 0, fmt.Errorf("fingerprint hash must be a string")
	}
	withoutQuotes := strings.ReplaceAll(str, "\"", "")
	// Return 0 for hashes that don't fit in 64 bits (e.g. MD5 is 128 bits)
	if len(withoutQuotes) > 16 {
		return 0, nil
	}
	hashUint, err := strconv.ParseUint(withoutQuotes, 16, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid fingerprint hash: %w", err)
	}
	return FingerprintHash(int64(hashUint)), nil
}
