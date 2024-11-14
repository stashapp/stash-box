package utils

import (
	"bytes"
	"encoding/json"

	"github.com/jmoiron/sqlx/types"
)

func ToJSON(data interface{}) (*types.JSONText, error) {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		return nil, err
	}
	var ret types.JSONText = buffer.Bytes()
	return &ret, nil
}

func FromJSON(data types.JSONText, obj interface{}) error {
	return json.Unmarshal(data, obj)
}
