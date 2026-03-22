package edit

import (
	"encoding/json"
	"errors"
	"testing"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/models"
)

func TestBuildTagEditData_NoChanges(t *testing.T) {
	// Create an edit with existing data
	name := "Test Tag"
	existingData := models.TagEditData{
		New: &models.TagEdit{
			Name: &name,
		},
	}
	data, _ := json.Marshal(existingData)

	edit := &models.Edit{
		ID:   uuid.Must(uuid.NewV4()),
		Data: data,
	}

	// Call with empty details (no changes)
	details := models.TagEditDetailsInput{}

	_, err := buildTagEditData(edit, details)
	if !errors.Is(err, ErrNoChangesInAmend) {
		t.Errorf("expected ErrNoChangesInAmend, got %v", err)
	}
}

func TestBuildTagEditData_WithChanges(t *testing.T) {
	// Create an edit with existing data
	name := "Test Tag"
	existingData := models.TagEditData{
		New: &models.TagEdit{
			Name: &name,
		},
	}
	data, _ := json.Marshal(existingData)

	edit := &models.Edit{
		ID:   uuid.Must(uuid.NewV4()),
		Data: data,
	}

	// Call with new name (has changes)
	newName := "Updated Tag"
	details := models.TagEditDetailsInput{
		Name: &newName,
	}

	result, err := buildTagEditData(edit, details)
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if result == nil {
		t.Error("expected result, got nil")
	}

	// Verify the result contains the new name
	var resultData models.TagEditData
	if err := json.Unmarshal(result, &resultData); err != nil {
		t.Errorf("failed to unmarshal result: %v", err)
	}
	if resultData.New == nil || resultData.New.Name == nil || *resultData.New.Name != newName {
		t.Errorf("expected name to be %q, got %v", newName, resultData.New)
	}
}

func TestBuildTagEditData_SameValue(t *testing.T) {
	// Create an edit with existing data
	name := "Test Tag"
	existingData := models.TagEditData{
		New: &models.TagEdit{
			Name: &name,
		},
	}
	data, _ := json.Marshal(existingData)

	edit := &models.Edit{
		ID:   uuid.Must(uuid.NewV4()),
		Data: data,
	}

	// Call with same name value (no actual change)
	sameName := "Test Tag"
	details := models.TagEditDetailsInput{
		Name: &sameName,
	}

	_, err := buildTagEditData(edit, details)
	if !errors.Is(err, ErrNoChangesInAmend) {
		t.Errorf("expected ErrNoChangesInAmend when submitting same value, got %v", err)
	}
}
