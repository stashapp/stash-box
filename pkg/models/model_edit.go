package models

import (
	"bytes"
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"

	"github.com/stashapp/stash-box/pkg/database"
)

const (
	editTable   = "edits"
	editJoinKey = "edit_id"

	//voteTable = "votes"
)

var (
	editDBTable = database.NewTable(editTable, func() interface{} {
		return &Edit{}
	})

	editTagTable = database.NewTableJoin(editTable, "tag_edits", editJoinKey, func() interface{} {
		return &EditTag{}
	})

	editPerformerTable = database.NewTableJoin(editTable, "performer_edits", editJoinKey, func() interface{} {
		return &EditPerformer{}
	})

	editCommentTable = database.NewTableJoin(editTable, "edit_comments", editJoinKey, func() interface{} {
		return &EditComment{}
	})

	// voteDBTable = database.NewTable(editTable, func() interface{} {
	// 	return &Edit{}
	// })
)

type Edit struct {
	ID         uuid.UUID       `db:"id" json:"id"`
	UserID     uuid.UUID       `db:"user_id" json:"user_id"`
	TargetType string          `db:"target_type" json:"target_type"`
	Operation  string          `db:"operation" json:"operation"`
	VoteCount  int             `db:"votes" json:"votes"`
	Status     string          `db:"status" json:"status"`
	Applied    bool            `db:"applied" json:"applied"`
	Data       types.JSONText  `db:"data" json:"data"`
	CreatedAt  SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt  SQLiteTimestamp `db:"updated_at" json:"updated_at"`
}

type EditComment struct {
	ID        uuid.UUID       `db:"id" json:"id"`
	EditID    uuid.UUID       `db:"edit_id" json:"edit_id"`
	UserID    uuid.UUID       `db:"user_id" json:"user_id"`
	CreatedAt SQLiteTimestamp `db:"created_at" json:"created_at"`
	Text      string          `db:"text" json:"text"`
}

func NewEdit(UUID uuid.UUID, user *User, targetType TargetTypeEnum, input *EditInput) *Edit {
	currentTime := time.Now()

	ret := &Edit{
		ID:         UUID,
		UserID:     user.ID,
		TargetType: targetType.String(),
		Status:     VoteStatusEnumPending.String(),
		Operation:  input.Operation.String(),
		CreatedAt:  SQLiteTimestamp{Timestamp: currentTime},
		UpdatedAt:  SQLiteTimestamp{Timestamp: currentTime},
	}

	return ret
}

func NewEditComment(UUID uuid.UUID, user *User, edit *Edit, text string) *EditComment {
	currentTime := time.Now()

	ret := &EditComment{
		ID:        UUID,
		EditID:    edit.ID,
		UserID:    user.ID,
		CreatedAt: SQLiteTimestamp{Timestamp: currentTime},
		Text:      text,
	}

	return ret
}

func (Edit) GetTable() database.Table {
	return editDBTable
}

func (p Edit) GetID() uuid.UUID {
	return p.ID
}

func (p *Edit) ImmediateAccept() {
	p.Status = VoteStatusEnumImmediateAccepted.String()
	p.Applied = true
	p.UpdatedAt = SQLiteTimestamp{Timestamp: time.Now()}
}

func (p *Edit) ImmediateReject() {
	p.Status = VoteStatusEnumImmediateRejected.String()
	p.UpdatedAt = SQLiteTimestamp{Timestamp: time.Now()}
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

type Edits []*Edit

func (p Edits) Each(fn func(interface{})) {
	for _, v := range p {
		fn(*v)
	}
}

func (p *Edits) Add(o interface{}) {
	*p = append(*p, o.(*Edit))
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

// type VoteComment struct {
// 	ID      uuid.UUID      `db:"id" json:"id"`
// 	EditID  uuid.UUID      `db:"edit_id" json:"edit_id"`
// 	UserID  uuid.UUID      `db:"user_id" json:"user_id"`
// 	Date    SQLiteDate     `db:"date" json:"date"`
// 	Comment sql.NullString `db:"comment" json:"comment"`
// 	Type    string         `db:"type" json:"type"`
// }

// func (p *Scene) CopyFromCreateInput(input SceneCreateInput) {
// 	CopyFull(p, input)

// 	if input.Date != nil {
// 		p.setDate(*input.Date)
// 	}
// }

// func (p *Scene) CopyFromUpdateInput(input SceneUpdateInput) {
// 	CopyFull(p, input)

// 	if input.Date != nil {
// 		p.setDate(*input.Date)
// 	}
// }

type TagEdit struct {
	Name           *string  `json:"name,omitempty"`
	Description    *string  `json:"description,omitempty"`
	AddedAliases   []string `json:"added_aliases,omitempty"`
	RemovedAliases []string `json:"removed_aliases,omitempty"`
	CategoryID     *string  `json:"category_id,omitempty"`
}

func (TagEdit) IsEditDetails() {}

type TagEditData struct {
	New          *TagEdit `json:"new_data,omitempty"`
	Old          *TagEdit `json:"old_data,omitempty"`
	MergeSources []string `json:"merge_sources,omitempty"`
}

func (PerformerEdit) IsEditDetails() {}

type PerformerEdit struct {
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
	AddedImages       []string            `json:"added_images,omitempty"`
	RemovedImages     []string            `json:"removed_images,omitempty"`
}

type PerformerEditData struct {
	New              *PerformerEdit `json:"new_data,omitempty"`
	Old              *PerformerEdit `json:"old_data,omitempty"`
	MergeSources     []string       `json:"merge_sources,omitempty"`
	SetModifyAliases bool           `json:"modify_aliases,omitempty"`
	SetMergeAliases  bool           `json:"merge_aliases,omitempty"`
}

type EditData struct {
	New          *json.RawMessage `json:"new_data,omitempty"`
	Old          *json.RawMessage `json:"old_data,omitempty"`
	MergeSources []string         `json:"merge_sources,omitempty"`
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
