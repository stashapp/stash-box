package api

import (
	"context"
	"time"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
)

const defaultChangelogLimit = 5000

// changelogArgs normalises the optional cursor/limit args shared by every
// *Changelog query. after_id is the keyset tiebreaker (nil → the zero UUID, so
// the first page starts at the beginning of the since timestamp).
func changelogArgs(afterID *uuid.UUID, limit *int) (uuid.UUID, int32) {
	after := uuid.Nil
	if afterID != nil {
		after = *afterID
	}
	l := defaultChangelogLimit
	if limit != nil {
		l = *limit
	}
	return after, int32(l)
}

func (r *queryResolver) SceneChangelog(ctx context.Context, since time.Time, afterID *uuid.UUID, limit *int) ([]models.EntityChange, error) {
	after, l := changelogArgs(afterID, limit)
	return r.services.Scene().Changelog(ctx, since, after, l)
}

func (r *queryResolver) PerformerChangelog(ctx context.Context, since time.Time, afterID *uuid.UUID, limit *int) ([]models.EntityChange, error) {
	after, l := changelogArgs(afterID, limit)
	return r.services.Performer().Changelog(ctx, since, after, l)
}

func (r *queryResolver) StudioChangelog(ctx context.Context, since time.Time, afterID *uuid.UUID, limit *int) ([]models.EntityChange, error) {
	after, l := changelogArgs(afterID, limit)
	return r.services.Studio().Changelog(ctx, since, after, l)
}

func (r *queryResolver) TagChangelog(ctx context.Context, since time.Time, afterID *uuid.UUID, limit *int) ([]models.EntityChange, error) {
	after, l := changelogArgs(afterID, limit)
	return r.services.Tag().Changelog(ctx, since, after, l)
}
