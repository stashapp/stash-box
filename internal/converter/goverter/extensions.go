package goverter

import (
	"encoding/json"
	"reflect"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/stashapp/stash-box/pkg/models"
)

// Extend functions for type conversions

// Enum validation helper (copied from utils package)
type validator interface {
	IsValid() bool
}

func validateEnum(value interface{}) bool {
	v, ok := value.(validator)
	if !ok {
		// shouldn't happen
		return false
	}
	return v.IsValid()
}

func resolveEnumString(value string, out interface{}) bool {
	if value == "" {
		return false
	}
	outValue := reflect.ValueOf(out).Elem()
	outValue.SetString(value)
	return validateEnum(out)
}

func ConvertPgTimestamp(ts pgtype.Timestamp) time.Time {
	return ts.Time
}

func ConvertNullUUID(u pgtype.UUID) uuid.NullUUID {
	if u.Valid {
		return uuid.NullUUID{UUID: u.Bytes, Valid: true}
	}
	return uuid.NullUUID{Valid: false}
}

func ConvertNullString(t pgtype.Text) *string {
	if t.Valid {
		return &t.String
	}
	return nil
}

func ConvertNullInt(i pgtype.Int4) *int {
	if i.Valid {
		val := int(i.Int32)
		return &val
	}
	return nil
}

func ConvertInt32ToInt(i int32) int {
	return int(i)
}

func ConvertUUIDToNullUUID(u uuid.UUID) uuid.NullUUID {
	return uuid.NullUUID{UUID: u, Valid: true}
}

func ConvertNullTimestamp(ts pgtype.Timestamp) *time.Time {
	if ts.Valid {
		return &ts.Time
	}
	return nil
}

func ConvertBytesToJSON(data []byte) json.RawMessage {
	if len(data) == 0 {
		return nil
	}
	return json.RawMessage(data)
}

// Generalized enum conversion functions using ResolveEnumString

func ConvertTextToGenderEnum(t pgtype.Text) *models.GenderEnum {
	if !t.Valid {
		return nil
	}
	var enum models.GenderEnum
	if resolveEnumString(t.String, &enum) {
		return &enum
	}
	return nil
}

func ConvertTextToEthnicityEnum(t pgtype.Text) *models.EthnicityEnum {
	if !t.Valid {
		return nil
	}
	var enum models.EthnicityEnum
	if resolveEnumString(t.String, &enum) {
		return &enum
	}
	return nil
}

func ConvertTextToEyeColorEnum(t pgtype.Text) *models.EyeColorEnum {
	if !t.Valid {
		return nil
	}
	var enum models.EyeColorEnum
	if resolveEnumString(t.String, &enum) {
		return &enum
	}
	return nil
}

func ConvertTextToHairColorEnum(t pgtype.Text) *models.HairColorEnum {
	if !t.Valid {
		return nil
	}
	var enum models.HairColorEnum
	if resolveEnumString(t.String, &enum) {
		return &enum
	}
	return nil
}

func ConvertTextToBreastTypeEnum(t pgtype.Text) *models.BreastTypeEnum {
	if !t.Valid {
		return nil
	}
	var enum models.BreastTypeEnum
	if resolveEnumString(t.String, &enum) {
		return &enum
	}
	return nil
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

// Tag conversion functions

func ConvertStringToPgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: true}
}

func ConvertStringPtrToPgText(s *string) pgtype.Text {
	if s == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func ConvertTimeToPgTimestamp(t time.Time) pgtype.Timestamp {
	return pgtype.Timestamp{Time: t, Valid: true}
}

func ConvertIntPtrToPgInt4(i *int) pgtype.Int4 {
	if i == nil {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: int32(*i), Valid: true}
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

// Enum to text conversion functions for performers

func ConvertGenderEnumToPgText(enum *models.GenderEnum) pgtype.Text {
	if enum == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: enum.String(), Valid: true}
}

func ConvertEthnicityEnumToPgText(enum *models.EthnicityEnum) pgtype.Text {
	if enum == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: enum.String(), Valid: true}
}

func ConvertEyeColorEnumToPgText(enum *models.EyeColorEnum) pgtype.Text {
	if enum == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: enum.String(), Valid: true}
}

func ConvertHairColorEnumToPgText(enum *models.HairColorEnum) pgtype.Text {
	if enum == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: enum.String(), Valid: true}
}

func ConvertBreastTypeEnumToPgText(enum *models.BreastTypeEnum) pgtype.Text {
	if enum == nil {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: enum.String(), Valid: true}
}

// Edit conversion functions

func ConvertJSONToBytes(data json.RawMessage) []byte {
	if data == nil {
		return nil
	}
	return []byte(data)
}

func ConvertIntToInt32(i int) int32 {
	return int32(i)
}

func ConvertUUIDNullToNullUUID(u uuid.NullUUID) uuid.NullUUID {
	return u
}

func ConvertTimePtrToPgTimestamp(t *time.Time) pgtype.Timestamp {
	if t == nil {
		return pgtype.Timestamp{Valid: false}
	}
	return pgtype.Timestamp{Time: *t, Valid: true}
}

func ConvertNullUUIDToUUID(u uuid.NullUUID) uuid.UUID {
	return u.UUID
}

func ConvertPgInt4ToInt(i pgtype.Int4) int {
	if i.Valid {
		return int(i.Int32)
	}
	return 0
}

func ConvertStringSliceToPgTextArray(value []string) pgtype.Array[pgtype.Text] {
	var arr pgtype.Array[pgtype.Text]
	elements := make([]pgtype.Text, len(value))
	for i, s := range value {
		elements[i] = pgtype.Text{String: s, Valid: true}
	}
	arr.Elements = elements
	arr.Valid = true
	return arr
}
