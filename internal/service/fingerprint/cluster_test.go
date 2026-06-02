package fingerprint

import (
	"testing"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// A linked oshash submitted against more than one scene has one
// LoadClusterSubmissions row per scene. buildMember must attach it to every
// scene it appears on; attaching only the first row drops it from the others,
// which omitted it from the move and left it behind on the source scene.
func TestBuildMemberLinksOshashAcrossAllScenes(t *testing.T) {
	const (
		phashID   = 1
		oshashID  = 2
		phashHsh  = models.FingerprintHash(0xAAAA)
		oshashHsh = models.FingerprintHash(0xBBBB)
	)
	sceneA := uuid.FromStringOrNil("019e7850-00e3-719a-b3b0-7dba03d43d43")
	sceneB := uuid.FromStringOrNil("019e7940-320b-75cc-9430-a21bd9350b24")

	hashByID := map[int]models.FingerprintHash{phashID: phashHsh, oshashID: oshashHsh}
	oshashByPhash := map[int][]int{phashID: {oshashID}}
	subsByMember := map[int][]queries.LoadClusterSubmissionsRow{
		phashID: {
			{FingerprintID: phashID, SceneID: sceneA, Submissions: 1},
			{FingerprintID: phashID, SceneID: sceneB, Submissions: 1},
		},
		// The same oshash hash on both scenes => one row per scene.
		oshashID: {
			{FingerprintID: oshashID, SceneID: sceneA, Submissions: 1},
			{FingerprintID: oshashID, SceneID: sceneB, Submissions: 1},
		},
	}

	member := buildMember(phashID, hashByID, subsByMember, oshashByPhash)

	linkedByScene := make(map[uuid.UUID][]models.ClusterOshash)
	for _, ss := range member.SceneSubmissions {
		linkedByScene[ss.SceneID] = ss.LinkedFingerprints
	}

	for _, sceneID := range []uuid.UUID{sceneA, sceneB} {
		linked := linkedByScene[sceneID]
		if len(linked) != 1 {
			t.Fatalf("scene %s: expected 1 linked oshash, got %d", sceneID, len(linked))
		}
		if linked[0].Hash != oshashHsh {
			t.Errorf("scene %s: expected oshash %x, got %x", sceneID, oshashHsh, linked[0].Hash)
		}
	}
}
