package models

import (
	"bytes"
	"encoding/json"
	"strings"
	"time"

	"github.com/gofrs/uuid"
)

type Edit struct {
	ID          uuid.UUID       `json:"id"`
	UserID      uuid.NullUUID   `json:"user_id"`
	TargetType  string          `json:"target_type"`
	Operation   string          `json:"operation"`
	VoteCount   int             `json:"votes"`
	Status      string          `json:"status"`
	Applied     bool            `json:"applied"`
	Data        json.RawMessage `json:"data"`
	Bot         bool            `json:"bot"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdateCount int             `json:"update_count"`
	UpdatedAt   *time.Time      `json:"updated_at"`
	ClosedAt    *time.Time      `json:"closed_at"`
}

type EditComment struct {
	ID        uuid.UUID     `json:"id"`
	EditID    uuid.UUID     `json:"edit_id"`
	UserID    uuid.NullUUID `json:"user_id"`
	CreatedAt time.Time     `json:"created_at"`
	Text      string        `json:"text"`
}

type EditVote struct {
	EditID    uuid.UUID `json:"edit_id"`
	UserID    uuid.UUID `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Vote      string    `json:"vote"`
}

func NewEdit(id uuid.UUID, user *User, targetType TargetTypeEnum, input *EditInput) *Edit {
	userID := uuid.NullUUID{UUID: user.ID, Valid: true}
	ret := &Edit{
		ID:         id,
		UserID:     userID,
		TargetType: targetType.String(),
		Status:     VoteStatusEnumPending.String(),
		Operation:  input.Operation.String(),
		CreatedAt:  time.Now(),
	}

	if input.Bot != nil && *input.Bot {
		ret.Bot = true
	} else {
		ret.Bot = false
	}

	return ret
}

func NewEditComment(id uuid.UUID, userID uuid.UUID, edit *Edit, text string) *EditComment {
	ret := &EditComment{
		ID:        id,
		EditID:    edit.ID,
		UserID:    uuid.NullUUID{UUID: userID, Valid: true},
		CreatedAt: time.Now(),
		Text:      text,
	}

	return ret
}

func (e *Edit) Accept() {
	e.Status = VoteStatusEnumAccepted.String()
	e.Applied = true
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) ImmediateAccept() {
	e.Status = VoteStatusEnumImmediateAccepted.String()
	e.Applied = true
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) ImmediateReject() {
	e.Status = VoteStatusEnumImmediateRejected.String()
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) Reject() {
	e.Status = VoteStatusEnumRejected.String()
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) Fail() {
	e.Status = VoteStatusEnumFailed.String()
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) Cancel() {
	e.Status = VoteStatusEnumCanceled.String()
	now := time.Now()
	e.ClosedAt = &now
}

func (e *Edit) SetData(data interface{}) error {
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

type EditData struct {
	New          *json.RawMessage `json:"new_data,omitempty"`
	Old          *json.RawMessage `json:"old_data,omitempty"`
	MergeSources []uuid.UUID      `json:"merge_sources,omitempty"`
}

func (e *Edit) GetData() *EditData {
	data := EditData{}
	err := json.Unmarshal(e.Data, &data)
	if err != nil {
		return nil
	}
	return &data
}

func (e *Edit) GetTagData() (*TagEditData, error) {
	data := TagEditData{}
	_ = json.Unmarshal(e.Data, &data)
	return &data, nil
}

func (e *Edit) GetPerformerData() (*PerformerEditData, error) {
	data := PerformerEditData{}
	_ = json.Unmarshal(e.Data, &data)
	return &data, nil
}

func (e *Edit) GetStudioData() (*StudioEditData, error) {
	data := StudioEditData{}
	_ = json.Unmarshal(e.Data, &data)
	return &data, nil
}

func (e *Edit) GetSceneData() (*SceneEditData, error) {
	data := SceneEditData{}
	_ = json.Unmarshal(e.Data, &data)
	return &data, nil
}

func (e *Edit) IsDestructive() bool {
	if e.Operation == OperationEnumDestroy.String() || e.Operation == OperationEnumMerge.String() {
		return true
	}
	// When renaming a performer and not updating the performance aliases
	if (e.Operation == OperationEnumModify.String() || e.Operation == OperationEnumMerge.String()) && e.TargetType == TargetTypeEnumPerformer.String() {
		data, _ := e.GetPerformerData()
		if data.New.Name != nil {
			oldName := ""
			if data.Old.Name != nil {
				oldName = strings.TrimSpace(*data.Old.Name)
			}
			return oldName != *data.New.Name && !data.SetModifyAliases
		}
	}
	return false
}

type TagEdit struct {
	EditID         uuid.UUID  `json:"-"`
	Name           *string    `json:"name,omitempty"`
	Description    *string    `json:"description,omitempty"`
	AddedAliases   []string   `json:"added_aliases,omitempty"`
	RemovedAliases []string   `json:"removed_aliases,omitempty"`
	CategoryID     *uuid.UUID `json:"category_id,omitempty"`
}

func (TagEdit) IsEditDetails() {}

type TagEditData struct {
	New          *TagEdit    `json:"new_data,omitempty"`
	Old          *TagEdit    `json:"old_data,omitempty"`
	MergeSources []uuid.UUID `json:"merge_sources,omitempty"`
}

type PerformerEdit struct {
	EditID           uuid.UUID          `json:"-"`
	Name             *string            `json:"name,omitempty"`
	Disambiguation   *string            `json:"disambiguation,omitempty"`
	AddedAliases     []string           `json:"added_aliases,omitempty"`
	RemovedAliases   []string           `json:"removed_aliases,omitempty"`
	Gender           *string            `json:"gender,omitempty"`
	AddedUrls        []URL              `json:"added_urls,omitempty"`
	RemovedUrls      []URL              `json:"removed_urls,omitempty"`
	Birthdate        *string            `json:"birthdate,omitempty"`
	Deathdate        *string            `json:"deathdate,omitempty"`
	Ethnicity        *string            `json:"ethnicity,omitempty"`
	Country          *string            `json:"country,omitempty"`
	EyeColor         *string            `json:"eye_color,omitempty"`
	HairColor        *string            `json:"hair_color,omitempty"`
	Height           *int               `json:"height,omitempty"`
	CupSize          *string            `json:"cup_size,omitempty"`
	BandSize         *int               `json:"band_size,omitempty"`
	WaistSize        *int               `json:"waist_size,omitempty"`
	HipSize          *int               `json:"hip_size,omitempty"`
	BreastType       *string            `json:"breast_type,omitempty"`
	CareerStartYear  *int               `json:"career_start_year,omitempty"`
	CareerEndYear    *int               `json:"career_end_year,omitempty"`
	AddedTattoos     []BodyModification `json:"added_tattoos,omitempty"`
	RemovedTattoos   []BodyModification `json:"removed_tattoos,omitempty"`
	AddedPiercings   []BodyModification `json:"added_piercings,omitempty"`
	RemovedPiercings []BodyModification `json:"removed_piercings,omitempty"`
	AddedImages      []uuid.UUID        `json:"added_images,omitempty"`
	RemovedImages    []uuid.UUID        `json:"removed_images,omitempty"`
	DraftID          *uuid.UUID         `json:"draft_id,omitempty"`
}

func (PerformerEdit) IsEditDetails() {}

type PerformerEditData struct {
	New              *PerformerEdit `json:"new_data,omitempty"`
	Old              *PerformerEdit `json:"old_data,omitempty"`
	MergeSources     []uuid.UUID    `json:"merge_sources,omitempty"`
	SetModifyAliases bool           `json:"modify_aliases,omitempty"`
	SetMergeAliases  bool           `json:"merge_aliases,omitempty"`
}

type StudioEdit struct {
	EditID uuid.UUID `json:"-"`
	Name   *string   `json:"name"`
	// Added and modified URLs
	AddedUrls      []URL       `json:"added_urls,omitempty"`
	RemovedUrls    []URL       `json:"removed_urls,omitempty"`
	ParentID       *uuid.UUID  `json:"parent_id,omitempty"`
	AddedImages    []uuid.UUID `json:"added_images,omitempty"`
	RemovedImages  []uuid.UUID `json:"removed_images,omitempty"`
	AddedAliases   []string    `json:"added_aliases,omitempty"`
	RemovedAliases []string    `json:"removed_aliases,omitempty"`
}

func (StudioEdit) IsEditDetails() {}

type StudioEditData struct {
	New          *StudioEdit `json:"new_data,omitempty"`
	Old          *StudioEdit `json:"old_data,omitempty"`
	MergeSources []uuid.UUID `json:"merge_sources,omitempty"`
}

type SceneEdit struct {
	EditID              uuid.UUID                  `json:"-"`
	Title               *string                    `json:"title,omitempty"`
	Details             *string                    `json:"details,omitempty"`
	AddedUrls           []URL                      `json:"added_urls,omitempty"`
	RemovedUrls         []URL                      `json:"removed_urls,omitempty"`
	Date                *string                    `json:"date,omitempty"`
	ProductionDate      *string                    `json:"production_date,omitempty"`
	StudioID            *uuid.UUID                 `json:"studio_id,omitempty"`
	AddedPerformers     []PerformerAppearanceInput `json:"added_performers,omitempty"`
	RemovedPerformers   []PerformerAppearanceInput `json:"removed_performers,omitempty"`
	AddedTags           []uuid.UUID                `json:"added_tags,omitempty"`
	RemovedTags         []uuid.UUID                `json:"removed_tags,omitempty"`
	AddedImages         []uuid.UUID                `json:"added_images,omitempty"`
	RemovedImages       []uuid.UUID                `json:"removed_images,omitempty"`
	AddedFingerprints   []FingerprintInput         `json:"added_fingerprints,omitempty"`
	RemovedFingerprints []FingerprintInput         `json:"removed_fingerprints,omitempty"`
	Duration            *int                       `json:"duration,omitempty"`
	Director            *string                    `json:"director,omitempty"`
	Code                *string                    `json:"code,omitempty"`
	DraftID             *uuid.UUID                 `json:"draft_id,omitempty"`
}

func (SceneEdit) IsEditDetails() {}

type SceneEditData struct {
	New          *SceneEdit  `json:"new_data,omitempty"`
	Old          *SceneEdit  `json:"old_data,omitempty"`
	MergeSources []uuid.UUID `json:"merge_sources,omitempty"`
}

type EditQuery struct {
	Filter EditQueryInput
}
