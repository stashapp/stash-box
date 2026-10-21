package models

import (
	"github.com/gofrs/uuid"
	"time"
)

type FingerprintReport struct {
	ID             uuid.UUID
	Hash           FingerprintHash
	Algorithm      FingerprintAlgorithm
	SceneID        uuid.UUID
	CorrectSceneID uuid.NullUUID
	UserID         uuid.NullUUID
	Comment        *string
	CreatedAt      time.Time
	Status         FingerprintReportStatus
	ResolvedAt     *time.Time
	ResolvedByID   uuid.NullUUID
}
