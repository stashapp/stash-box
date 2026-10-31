package queries

import (
	"context"

	"github.com/gofrs/uuid"
)

type CreateSceneTagsParams struct {
	SceneID uuid.UUID
	TagID   uuid.UUID
}

// CreateSceneTags resolves the public UUID pairs in one SQL batch.
func (q *Queries) CreateSceneTags(ctx context.Context, rows []CreateSceneTagsParams) (int64, error) {
	if len(rows) == 0 {
		return 0, nil
	}
	params := InsertSceneTagsParams{
		SceneIds: make([]uuid.UUID, len(rows)),
		TagIds:   make([]uuid.UUID, len(rows)),
	}
	for i, row := range rows {
		params.SceneIds[i] = row.SceneID
		params.TagIds[i] = row.TagID
	}
	return q.InsertSceneTags(ctx, params)
}
