package models

import "uuid"

type ClusterSceneSubmission struct {
	SceneID            uuid.UUID
	Submissions        int
	Reports            int
	Durations          []DurationCount
	LinkedFingerprints []ClusterOshash
}
