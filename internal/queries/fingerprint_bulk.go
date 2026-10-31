package queries

import (
	"context"

	"github.com/gofrs/uuid"
)

// CreateSceneFingerprintsParams keeps public identifiers at the query boundary.
type CreateSceneFingerprintsParams struct {
	FingerprintID int
	SceneID       uuid.UUID
	UserID        uuid.UUID
	Duration      int
}

// CreateSceneFingerprints resolves UUIDs in one batch, not once per submission.
func (q *Queries) CreateSceneFingerprints(ctx context.Context, rows []CreateSceneFingerprintsParams) (int64, error) {
	if len(rows) == 0 {
		return 0, nil
	}
	params := InsertSceneFingerprintsParams{
		FingerprintIds: make([]int, len(rows)),
		SceneIds:       make([]uuid.UUID, len(rows)),
		UserIds:        make([]uuid.UUID, len(rows)),
		Durations:      make([]int, len(rows)),
	}
	for i, row := range rows {
		params.FingerprintIds[i] = row.FingerprintID
		params.SceneIds[i] = row.SceneID
		params.UserIds[i] = row.UserID
		params.Durations[i] = row.Duration
	}
	return q.InsertSceneFingerprints(ctx, params)
}
