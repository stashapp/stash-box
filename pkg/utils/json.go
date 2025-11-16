// nolint: revive
package utils

import (
	"bytes"
	"encoding/json"
)

func ToJSON(data interface{}) (json.RawMessage, error) {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		return nil, err
	}
	return buffer.Bytes(), nil
}

func FromJSON(data json.RawMessage, obj interface{}) error {
	return json.Unmarshal(data, obj)
}
