package models

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"
)

type Edit struct {
	ID         uuid.UUID      `db:"id" json:"id"`
	UserID     uuid.UUID      `db:"user_id" json:"user_id"`
	TargetType string         `db:"target_type" json:"target_type"`
	Operation  string         `db:"operation" json:"operation"`
	VoteCount  int            `db:"votes" json:"votes"`
	Status     string         `db:"status" json:"status"`
	Applied    bool           `db:"applied" json:"applied"`
	Data       types.JSONText `db:"data" json:"data"`
	CreatedAt  time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt  sql.NullTime   `db:"updated_at" json:"updated_at"`
	ClosedAt   sql.NullTime   `db:"closed_at" json:"closed_at"`
}

type EditComment struct {
	ID        uuid.UUID `db:"id" json:"id"`
	EditID    uuid.UUID `db:"edit_id" json:"edit_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	Text      string    `db:"text" json:"text"`
}

type EditVote struct {
	EditID    uuid.UUID `db:"edit_id" json:"edit_id"`
	UserID    uuid.UUID `db:"user_id" json:"user_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	Vote      string    `db:"vote" json:"vote"`
}

func NewEdit(uuid uuid.UUID, user *User, targetType TargetTypeEnum, input *EditInput) *Edit {
	ret := &Edit{
		ID:         uuid,
		UserID:     user.ID,
		TargetType: targetType.String(),
		Status:     VoteStatusEnumPending.String(),
		Operation:  input.Operation.String(),
		CreatedAt:  time.Now(),
	}

	return ret
}

func NewEditComment(uuid uuid.UUID, user *User, edit *Edit, text string) *EditComment {
	ret := &EditComment{
		ID:        uuid,
		EditID:    edit.ID,
		UserID:    user.ID,
		CreatedAt: time.Now(),
		Text:      text,
	}

	return ret
}

func (e Edit) GetID() uuid.UUID {
	return e.ID
}

func NewEditVote(user *User, edit *Edit, vote VoteTypeEnum) *EditVote {
	ret := &EditVote{
		EditID:    edit.ID,
		UserID:    user.ID,
		CreatedAt: time.Now(),
		Vote:      vote.String(),
	}

	return ret
}

func (e *Edit) Accept() {
	e.Status = VoteStatusEnumAccepted.String()
	e.Applied = true
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
}

func (e *Edit) ImmediateAccept() {
	e.Status = VoteStatusEnumImmediateAccepted.String()
	e.Applied = true
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
}

func (e *Edit) ImmediateReject() {
	e.Status = VoteStatusEnumImmediateRejected.String()
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
}

func (e *Edit) Reject() {
	e.Status = VoteStatusEnumRejected.String()
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
}

func (e *Edit) Fail() {
	e.Status = VoteStatusEnumFailed.String()
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
}

func (e *Edit) Cancel() {
	e.Status = VoteStatusEnumCanceled.String()
	e.ClosedAt = sql.NullTime{Time: time.Now(), Valid: true}
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

type Edits []*Edit

func (p Edits) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Edits) Add(o interface{}) {
	*p = append(*p, o.(*Edit))
}

type Redirect struct {
	SourceID uuid.UUID `db:"source_id" json:"source_id"`
	TargetID uuid.UUID `db:"target_id" json:"target_id"`
}

type Redirects []*Redirect

func (p *Redirects) Add(o interface{}) {
	*p = append(*p, o.(*Redirect))
}

func (p Redirects) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

type EditTag struct {
	EditID uuid.UUID `db:"edit_id" json:"edit_id"`
	TagID  uuid.UUID `db:"tag_id" json:"tag_id"`
}

type EditTags []*EditTag

func (p EditTags) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditTags) Add(o interface{}) {
	*p = append(*p, o.(*EditTag))
}

type EditPerformer struct {
	EditID      uuid.UUID `db:"edit_id" json:"edit_id"`
	PerformerID uuid.UUID `db:"performer_id" json:"performer_id"`
}

type EditPerformers []*EditPerformer

func (p EditPerformers) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditPerformers) Add(o interface{}) {
	*p = append(*p, o.(*EditPerformer))
}

type EditStudio struct {
	EditID   uuid.UUID `db:"edit_id" json:"edit_id"`
	StudioID uuid.UUID `db:"studio_id" json:"studio_id"`
}

type EditStudios []*EditStudio

func (p EditStudios) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditStudios) Add(o interface{}) {
	*p = append(*p, o.(*EditStudio))
}

type EditScene struct {
	EditID  uuid.UUID `db:"edit_id" json:"edit_id"`
	SceneID uuid.UUID `db:"scene_id" json:"scene_id"`
}

type EditScenes []*EditScene

func (p EditScenes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditScenes) Add(o interface{}) {
	*p = append(*p, o.(*EditScene))
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

func (PerformerEdit) IsEditDetails() {}

type PerformerEdit struct {
	EditID            uuid.UUID           `json:"-"`
	Name              *string             `json:"name,omitempty"`
	Disambiguation    *string             `json:"disambiguation,omitempty"`
	AddedAliases      []string            `json:"added_aliases,omitempty"`
	RemovedAliases    []string            `json:"removed_aliases,omitempty"`
	Gender            *string             `json:"gender,omitempty"`
	AddedUrls         []*URL              `json:"added_urls,omitempty"`
	RemovedUrls       []*URL              `json:"removed_urls,omitempty"`
	Birthdate         *string             `json:"birthdate,omitempty"`
	BirthdateAccuracy *string             `json:"birthdate_accuracy,omitempty"`
	Ethnicity         *string             `json:"ethnicity,omitempty"`
	Country           *string             `json:"country,omitempty"`
	EyeColor          *string             `json:"eye_color,omitempty"`
	HairColor         *string             `json:"hair_color,omitempty"`
	Height            *int64              `json:"height,omitempty"`
	CupSize           *string             `json:"cup_size,omitempty"`
	BandSize          *int64              `json:"band_size,omitempty"`
	WaistSize         *int64              `json:"waist_size,omitempty"`
	HipSize           *int64              `json:"hip_size,omitempty"`
	BreastType        *string             `json:"breast_type,omitempty"`
	CareerStartYear   *int64              `json:"career_start_year,omitempty"`
	CareerEndYear     *int64              `json:"career_end_year,omitempty"`
	AddedTattoos      []*BodyModification `json:"added_tattoos,omitempty"`
	RemovedTattoos    []*BodyModification `json:"removed_tattoos,omitempty"`
	AddedPiercings    []*BodyModification `json:"added_piercings,omitempty"`
	RemovedPiercings  []*BodyModification `json:"removed_piercings,omitempty"`
	AddedImages       []uuid.UUID         `json:"added_images,omitempty"`
	RemovedImages     []uuid.UUID         `json:"removed_images,omitempty"`
	DraftID           *uuid.UUID          `json:"draft_id,omitempty"`
}

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
	AddedUrls     []*URL      `json:"added_urls,omitempty"`
	RemovedUrls   []*URL      `json:"removed_urls,omitempty"`
	ParentID      *uuid.UUID  `json:"parent_id,omitempty"`
	AddedImages   []uuid.UUID `json:"added_images,omitempty"`
	RemovedImages []uuid.UUID `json:"removed_images,omitempty"`
}

func (StudioEdit) IsEditDetails() {}

type StudioEditData struct {
	New          *StudioEdit `json:"new_data,omitempty"`
	Old          *StudioEdit `json:"old_data,omitempty"`
	MergeSources []uuid.UUID `json:"merge_sources,omitempty"`
}

type SceneEdit struct {
	EditID              uuid.UUID                   `json:"-"`
	Title               *string                     `json:"title,omitempty"`
	Details             *string                     `json:"details,omitempty"`
	AddedUrls           []*URL                      `json:"added_urls,omitempty"`
	RemovedUrls         []*URL                      `json:"removed_urls,omitempty"`
	Date                *string                     `json:"date,omitempty"`
	DateAccuracy        *string                     `json:"date_accuracy,omitempty"`
	StudioID            *uuid.UUID                  `json:"studio_id,omitempty"`
	AddedPerformers     []*PerformerAppearanceInput `json:"added_performers,omitempty"`
	RemovedPerformers   []*PerformerAppearanceInput `json:"removed_performers,omitempty"`
	AddedTags           []uuid.UUID                 `json:"added_tags,omitempty"`
	RemovedTags         []uuid.UUID                 `json:"removed_tags,omitempty"`
	AddedImages         []uuid.UUID                 `json:"added_images,omitempty"`
	RemovedImages       []uuid.UUID                 `json:"removed_images,omitempty"`
	AddedFingerprints   []*FingerprintInput         `json:"added_fingerprints,omitempty"`
	RemovedFingerprints []*FingerprintInput         `json:"removed_fingerprints,omitempty"`
	Duration            *int64                      `json:"duration,omitempty"`
	Director            *string                     `json:"director,omitempty"`
	Code                *string                     `json:"code,omitempty"`
	DraftID             *uuid.UUID                  `json:"draft_id,omitempty"`
}

func (SceneEdit) IsEditDetails() {}

type SceneEditData struct {
	New          *SceneEdit  `json:"new_data,omitempty"`
	Old          *SceneEdit  `json:"old_data,omitempty"`
	MergeSources []uuid.UUID `json:"merge_sources,omitempty"`
}

type EditData struct {
	New          *json.RawMessage `json:"new_data,omitempty"`
	Old          *json.RawMessage `json:"old_data,omitempty"`
	MergeSources []uuid.UUID      `json:"merge_sources,omitempty"`
}

type EditComments []*EditComment

func (p EditComments) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditComments) Add(o interface{}) {
	*p = append(*p, o.(*EditComment))
}

type EditVotes []*EditVote

func (p EditVotes) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *EditVotes) Add(o interface{}) {
	*p = append(*p, o.(*EditVote))
}

type EditQuery struct {
	Filter EditQueryInput
}
