package models

import "github.com/gofrs/uuid"

type ClusterSceneSubmission struct {
	SceneID     uuid.UUID
	Submissions int
	Reports     int
	Durations   []DurationCount
}

type ClusterOshash struct {
	Hash        FingerprintHash
	SceneID     uuid.UUID
	Submissions int
	Reports     int
}
