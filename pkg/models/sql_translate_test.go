package models

import (
	"database/sql"
	"testing"
)

func TestCopyFull(t *testing.T) {
	name := "name"
	disambiguation := "Disambiguation"
	height := 100
	ethnicity := EthnicityEnumCaucasian

	input := PerformerCreateInput{
		Name:           name,
		Disambiguation: &disambiguation,
		Height:         &height,
		Ethnicity:      &ethnicity,
	}

	target := Performer{
		Country: sql.NullString{String: "Country", Valid: true},
	}

	CopyFull(&target, input)

	if target.Name != name {
		t.Errorf("Expected '%s' got '%s'", name, target.Name)
	}
	if target.Disambiguation.String != disambiguation {
		t.Errorf("Expected '%s' got '%s'", disambiguation, target.Disambiguation.String)
	}
	if target.Height.Int64 != int64(height) {
		t.Errorf("Expected %d got %d", height, target.Height.Int64)
	}
	if target.Country.Valid {
		t.Errorf("Expected nil got '%s'", target.Country.String)
	}
	if target.Ethnicity.String != ethnicity.String() {
		t.Errorf("Expected '%s' got '%s'", ethnicity.String(), target.Ethnicity.String)
	}
}

func TestCopyFullUUID(t *testing.T) {
	studioID := "01234567-89ab-cdef-0123-456789abcdef"

	input := SceneCreateInput{
		StudioID: &studioID,
	}

	target := Scene{}

	CopyFull(&target, input)

	if target.StudioID.UUID.String() != studioID {
		t.Errorf("Expected '%s' got '%s'", studioID, target.StudioID.UUID.String())
	}
}
