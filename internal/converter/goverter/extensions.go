package goverter

import (
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/stashapp/stash-box/pkg/models"
)

// Extend functions for type conversions

func ConvertTime(t time.Time) time.Time {
	return t
}

func ConvertNullUUID(u pgtype.UUID) uuid.NullUUID {
	if u.Valid {
		return uuid.NullUUID{UUID: u.Bytes, Valid: true}
	}
	return uuid.NullUUID{Valid: false}
}

func ConvertNullIntToInt(i *int) int {
	if i != nil {
		return *i
	}
	return 0
}

func ConvertUUIDToNullUUID(u uuid.UUID) uuid.NullUUID {
	return uuid.NullUUID{UUID: u, Valid: true}
}

func ConvertBytesToJSON(data []byte) json.RawMessage {
	if len(data) == 0 {
		return nil
	}
	return json.RawMessage(data)
}

// Draft entity conversion functions

func ConvertDraftEntityInputPtr(entity *models.DraftEntityInput) *models.DraftEntity {
	if entity == nil {
		return nil
	}

	return &models.DraftEntity{
		Name: entity.Name,
		ID:   entity.ID,
	}
}

func ConvertDraftEntityInputSlice(entities []*models.DraftEntityInput) []models.DraftEntity {
	if entities == nil {
		return nil
	}

	var ret []models.DraftEntity
	for _, entity := range entities {
		if entity != nil {
			ret = append(ret, models.DraftEntity{
				Name: entity.Name,
				ID:   entity.ID,
			})
		}
	}
	return ret
}

func FilterDraftFingerprints(input []*models.FingerprintInput) []models.DraftFingerprint {
	resultMap := make(map[string]bool)
	var fingerprints []models.DraftFingerprint

	for _, fp := range input {
		unique := fp.Hash + fp.Algorithm.String()
		if _, exists := resultMap[unique]; !exists {
			fingerprints = append(fingerprints, models.DraftFingerprint{
				Hash:      fp.Hash,
				Algorithm: fp.Algorithm,
				Duration:  fp.Duration,
			})
			resultMap[unique] = true
		}
	}

	return fingerprints
}

// BodyModification conversion functions

func ConvertBodyModificationInputSlice(inputs []*models.BodyModificationInput) []*models.BodyModification {
	if inputs == nil {
		return nil
	}

	result := make([]*models.BodyModification, len(inputs))
	for i, input := range inputs {
		if input == nil {
			result[i] = nil
			continue
		}
		result[i] = &models.BodyModification{
			Location:    input.Location,
			Description: input.Description,
		}
	}
	return result
}

// Edit conversion functions

func ConvertJSONToBytes(data json.RawMessage) []byte {
	if data == nil {
		return nil
	}
	return []byte(data)
}

func ConvertUUIDNullToNullUUID(u uuid.NullUUID) uuid.NullUUID {
	return u
}

func ConvertNullUUIDToUUID(u uuid.NullUUID) uuid.UUID {
	return u.UUID
}
