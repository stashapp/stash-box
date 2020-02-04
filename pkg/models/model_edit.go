package models

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jmoiron/sqlx/types"

	"github.com/stashapp/stashdb/pkg/database"
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

	editTagTable = database.NewTableJoin(editTable, "tag_edit", editJoinKey, func() interface{} {
		return &TagEdit{}
	})

	// voteDBTable = database.NewTable(editTable, func() interface{} {
	// 	return &Edit{}
	// })
)

type Edit struct {
	ID          uuid.UUID       `db:"id" json:"id"`
	UserID      uuid.UUID       `db:"user_id" json:"user_id"`
	TargetType  string          `db:"target_type" json:"target_type"`
	Operation   string          `db:"operation" json:"operation"`
	EditComment sql.NullString  `db:"edit_comment" json:"edit_comment"`
	VoteCount   int             `db:"votes" json:"votes"`
	Status      string          `db:"status" json:"status"`
	Applied     bool            `db:"applied" json:"applied"`
	Data        types.JSONText  `db:"data" json:"data"`
	CreatedAt   SQLiteTimestamp `db:"created_at" json:"created_at"`
	UpdatedAt   SQLiteTimestamp `db:"updated_at" json:"updated_at"`
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

	if input.Comment != nil {
		ret.EditComment = sql.NullString{
			String: *input.Comment,
			Valid:  true,
		}
	}

	return ret
}

func (Edit) GetTable() database.Table {
	return editDBTable
}

func (p Edit) GetID() uuid.UUID {
	return p.ID
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
