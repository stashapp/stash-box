package models

import (
	"fmt"
	"time"

	"github.com/gofrs/uuid"
)

type InviteKey struct {
	ID          uuid.UUID  `json:"id"`
	Uses        *int       `json:"uses"`
	GeneratedBy uuid.UUID  `json:"generated_by"`
	GeneratedAt time.Time  `json:"generated_at"`
	Expires     *time.Time `json:"expires"`
}

func (p InviteKey) String() string {
	uses := "unlimited"
	expires := "never"

	if p.Uses != nil {
		uses = fmt.Sprintf("%d", *p.Uses)
	}
	if p.Expires != nil {
		expires = p.Expires.Format(time.RFC3339)
	}

	return fmt.Sprintf("%s: [%s] expires %s", p.ID, uses, expires)
}
