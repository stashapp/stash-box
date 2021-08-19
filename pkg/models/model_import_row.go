package models

import (
	"bytes"
	"encoding/json"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"
)

type ImportRowData map[string]interface{}

type ImportRow struct {
	UserID uuid.UUID      `db:"user_id" json:"user_id"`
	Row    int            `db:"row" json:"row"`
	Data   types.JSONText `db:"data" json:"data"`
}

func (e *ImportRow) SetData(data ImportRowData) error {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(data); err != nil {
		return err
	}
	e.Data = buffer.Bytes()
	return nil
}

func (e *ImportRow) GetData() ImportRowData {
	data := make(ImportRowData)
	err := json.Unmarshal(e.Data, &data)
	if err != nil {
		return nil
	}
	return data
}

type ImportRows []*ImportRow

func (p ImportRows) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *ImportRows) Add(o interface{}) {
	*p = append(*p, o.(*ImportRow))
}
