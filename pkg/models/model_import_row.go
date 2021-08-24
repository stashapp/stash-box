package models

import (
	"bytes"
	"encoding/json"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"
)

type ImportRowData map[string]interface{}

func (e ImportRowData) ToJSON() (string, error) {
	buffer := &bytes.Buffer{}
	encoder := json.NewEncoder(buffer)
	encoder.SetEscapeHTML(false)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(e); err != nil {
		return "", err
	}
	ret := buffer.Bytes()
	return string(ret), nil
}

type ImportRow struct {
	UserID uuid.UUID      `db:"user_id" json:"user_id"`
	Row    int            `db:"row" json:"row"`
	Data   types.JSONText `db:"data" json:"data"`
}

func (e *ImportRow) SetData(data ImportRowData) error {
	s, err := data.ToJSON()
	if err != nil {
		return err
	}

	e.Data = []byte(s)
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
