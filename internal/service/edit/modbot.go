package edit

import (
	"context"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/stashapp/stash-box/internal/queries"
)

const modUserName = "StashBot"

var modUserID *uuid.UUID

func getModBot(ctx context.Context, tx *queries.Queries) uuid.UUID {
	if modUserID == nil {
		modUser, err := tx.FindUserByName(ctx, modUserName)
		if err != nil {
			panic(fmt.Errorf("mod user not found: %w", err))
		}
		modUserID = &modUser.ID
	}

	return *modUserID
}
