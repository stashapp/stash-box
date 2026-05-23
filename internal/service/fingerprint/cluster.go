// Package fingerprint provides services for fingerprint clustering and analysis.
package fingerprint

import (
	"context"
	"crypto/sha1"
	"errors"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

// clusterIDNamespace is a fixed namespace UUID used to derive deterministic
// v5 cluster ids from sha1(member-hashes).
var clusterIDNamespace = uuid.Must(uuid.FromString("f8d2c6a4-2ee1-4d1d-b6f4-7e3ec0d6cf4b"))

// ErrBktreeRequired is returned when the bktree Postgres extension is not
// installed but is required for phash distance clustering.
var ErrBktreeRequired = errors.New("bktree extension required for phash distance clustering")

const (
	maxScenesPerCluster = 10
	maxBfsIterations    = 6
	maxClusterMembers   = 500
)

// Fingerprint is the cluster service.
type Fingerprint struct {
	queries *queries.Queries
}

// New creates a new Fingerprint service.
func New(q *queries.Queries) *Fingerprint {
	return &Fingerprint{queries: q}
}

// HasBktree reports whether the bktree extension is installed in the connected
// database.
func (s *Fingerprint) HasBktree(ctx context.Context) (bool, error) {
	var exists bool
	row := s.queries.DB().QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'bktree')")
	if err := row.Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

// ClusterScenes returns the cluster(s) seeded by the given scene's phash
// fingerprints, expanded out to all phashes within `distance` Hamming and the
// scenes that host them.
func (s *Fingerprint) ClusterScenes(ctx context.Context, seedScene uuid.UUID, distance int) ([]models.FingerprintCluster, error) {
	hasBktree, err := s.HasBktree(ctx)
	if err != nil {
		return nil, err
	}
	if !hasBktree {
		return nil, ErrBktreeRequired
	}

	seedIDs, err := s.queries.GetScenePhashFingerprintIDs(ctx, seedScene)
	if err != nil {
		return nil, err
	}
	if len(seedIDs) == 0 {
		return []models.FingerprintCluster{}, nil
	}

	closure, tainted, err := s.expandClosure(ctx, seedScene, seedIDs, distance)
	if err != nil {
		return nil, err
	}
	if len(closure) == 0 {
		return []models.FingerprintCluster{}, nil
	}

	memberIDs := make([]int, 0, len(closure))
	for id := range closure {
		memberIDs = append(memberIDs, id)
	}
	sort.Ints(memberIDs)

	hashes, err := s.queries.LoadClusterFingerprints(ctx, memberIDs)
	if err != nil {
		return nil, err
	}
	hashByID := make(map[int]models.FingerprintHash, len(hashes))
	algoByID := make(map[int]models.FingerprintAlgorithm, len(hashes))
	for _, r := range hashes {
		hashByID[r.ID] = models.FingerprintHash(r.Hash)
		algoByID[r.ID] = models.FingerprintAlgorithm(r.Algorithm)
	}

	edges, err := s.queries.LoadClusterEdges(ctx, queries.LoadClusterEdgesParams{
		Distance:       distance,
		FingerprintIds: memberIDs,
	})
	if err != nil {
		return nil, err
	}

	subs, err := s.queries.LoadClusterSubmissions(ctx, memberIDs)
	if err != nil {
		return nil, err
	}

	linkedOshashes, oshashMemberIDs, err := s.loadOshashLinks(ctx, memberIDs)
	if err != nil {
		return nil, err
	}
	if len(oshashMemberIDs) > 0 {
		extra, err := s.queries.LoadClusterFingerprints(ctx, oshashMemberIDs)
		if err != nil {
			return nil, err
		}
		for _, r := range extra {
			hashByID[r.ID] = models.FingerprintHash(r.Hash)
			algoByID[r.ID] = models.FingerprintAlgorithm(r.Algorithm)
		}
		oshashSubs, err := s.queries.LoadClusterSubmissions(ctx, oshashMemberIDs)
		if err != nil {
			return nil, err
		}
		subs = append(subs, oshashSubs...)
	}

	components := connectedComponents(memberIDs, edges)

	// Drop components that don't contain any seed-scene phash. These get
	// pulled into the closure by scene co-membership (a sibling phash on a
	// reached scene) but don't actually relate to the seed scene's content
	// — they're just noise from the bridging scene.
	seedSet := make(map[int]struct{}, len(seedIDs))
	for _, id := range seedIDs {
		seedSet[id] = struct{}{}
	}
	filtered := components[:0]
	for _, comp := range components {
		hasSeed := false
		for _, id := range comp {
			if _, ok := seedSet[id]; ok {
				hasSeed = true
				break
			}
		}
		if hasSeed {
			filtered = append(filtered, comp)
		}
	}
	components = filtered

	clusters := buildClusters(components, hashByID, algoByID, edges, subs, linkedOshashes, distance, tainted)
	if err := s.attachScenes(ctx, clusters); err != nil {
		return nil, err
	}

	sort.Slice(clusters, func(i, j int) bool {
		if len(clusters[i].Scenes) != len(clusters[j].Scenes) {
			return len(clusters[i].Scenes) > len(clusters[j].Scenes)
		}
		return len(clusters[i].Members) > len(clusters[j].Members)
	})
	return clusters, nil
}

// expandClosure performs scene-bounded BFS. Returns the set of fingerprint ids
// in the closure plus whether expansion hit the 3-scene taint limit.
func (s *Fingerprint) expandClosure(ctx context.Context, seedScene uuid.UUID, seedIDs []int, distance int) (map[int]struct{}, bool, error) {
	members := make(map[int]struct{}, len(seedIDs))
	scenes := map[uuid.UUID]struct{}{seedScene: {}}
	for _, id := range seedIDs {
		members[id] = struct{}{}
	}
	tainted := false

	frontier := seedIDs
	for iter := 0; iter < maxBfsIterations && len(frontier) > 0 && !tainted; iter++ {
		neighborRows, err := s.queries.ExpandPhashNeighbors(ctx, queries.ExpandPhashNeighborsParams{
			Distance:       distance,
			FingerprintIds: frontier,
		})
		if err != nil {
			return nil, false, err
		}

		newScenes := make(map[uuid.UUID]struct{})
		acceptableIDs := make(map[int]struct{})
		for _, row := range neighborRows {
			if _, ok := scenes[row.SceneID]; ok {
				acceptableIDs[row.NeighborID] = struct{}{}
				continue
			}
			newScenes[row.SceneID] = struct{}{}
		}

		if len(scenes)+len(newScenes) > maxScenesPerCluster {
			tainted = true
		} else {
			for sceneID := range newScenes {
				scenes[sceneID] = struct{}{}
			}
			for _, row := range neighborRows {
				acceptableIDs[row.NeighborID] = struct{}{}
			}
		}

		nextFrontier := make([]int, 0)
		for id := range acceptableIDs {
			if _, ok := members[id]; ok {
				continue
			}
			if len(members) >= maxClusterMembers {
				tainted = true
				break
			}
			members[id] = struct{}{}
			nextFrontier = append(nextFrontier, id)
		}

		if !tainted {
			sceneIDs := make([]uuid.UUID, 0, len(scenes))
			for sceneID := range scenes {
				sceneIDs = append(sceneIDs, sceneID)
			}
			coMembers, err := s.queries.ExpandSceneCoMembers(ctx, sceneIDs)
			if err != nil {
				return nil, false, err
			}
			for _, id := range coMembers {
				if _, ok := members[id]; ok {
					continue
				}
				if len(members) >= maxClusterMembers {
					tainted = true
					break
				}
				members[id] = struct{}{}
				nextFrontier = append(nextFrontier, id)
			}
		}

		frontier = nextFrontier
	}

	return members, tainted, nil
}

func (s *Fingerprint) loadOshashLinks(ctx context.Context, phashMemberIDs []int) ([]queries.LoadLinkedOshashSubmissionsRow, []int, error) {
	rows, err := s.queries.LoadLinkedOshashSubmissions(ctx, phashMemberIDs)
	if err != nil {
		return nil, nil, err
	}
	seen := make(map[int]struct{})
	oshashIDs := make([]int, 0)
	for _, row := range rows {
		if _, ok := seen[row.OshashFingerprintID]; ok {
			continue
		}
		seen[row.OshashFingerprintID] = struct{}{}
		oshashIDs = append(oshashIDs, row.OshashFingerprintID)
	}
	sort.Ints(oshashIDs)
	return rows, oshashIDs, nil
}

// connectedComponents groups fingerprint ids into components via union-find
// over the edge set. Isolated nodes (no edges) form singleton components.
func connectedComponents(nodes []int, edges []queries.LoadClusterEdgesRow) [][]int {
	parent := make(map[int]int, len(nodes))
	for _, n := range nodes {
		parent[n] = n
	}
	var find func(int) int
	find = func(x int) int {
		if parent[x] != x {
			parent[x] = find(parent[x])
		}
		return parent[x]
	}
	union := func(a, b int) {
		ra, rb := find(a), find(b)
		if ra != rb {
			parent[ra] = rb
		}
	}
	for _, e := range edges {
		if _, ok := parent[e.AID]; !ok {
			continue
		}
		if _, ok := parent[e.BID]; !ok {
			continue
		}
		union(e.AID, e.BID)
	}
	groups := make(map[int][]int)
	for _, n := range nodes {
		root := find(n)
		groups[root] = append(groups[root], n)
	}
	out := make([][]int, 0, len(groups))
	for _, g := range groups {
		sort.Ints(g)
		out = append(out, g)
	}
	return out
}

func buildClusters(
	components [][]int,
	hashByID map[int]models.FingerprintHash,
	algoByID map[int]models.FingerprintAlgorithm,
	edges []queries.LoadClusterEdgesRow,
	subs []queries.LoadClusterSubmissionsRow,
	oshashLinks []queries.LoadLinkedOshashSubmissionsRow,
	distance int,
	tainted bool,
) []models.FingerprintCluster {
	memberOf := make(map[int]int)
	for ci, comp := range components {
		for _, id := range comp {
			memberOf[id] = ci
		}
	}

	subsByMember := make(map[int][]queries.LoadClusterSubmissionsRow)
	for _, row := range subs {
		subsByMember[row.FingerprintID] = append(subsByMember[row.FingerprintID], row)
	}

	// Aggregate oshash submissions per (oshash_id) and remember which phash member
	// they attached to (preferred = the phash that produced the strongest signal;
	// we just take the first by sort order for determinism).
	oshashAttach := make(map[int]int)
	oshashOrdered := make([]int, 0)
	for _, row := range oshashLinks {
		if _, ok := oshashAttach[row.OshashFingerprintID]; ok {
			continue
		}
		oshashAttach[row.OshashFingerprintID] = row.PhashFingerprintID
		oshashOrdered = append(oshashOrdered, row.OshashFingerprintID)
	}
	sort.Ints(oshashOrdered)

	clusters := make([]models.FingerprintCluster, 0, len(components))
	for _, comp := range components {
		members := make([]models.ClusterMember, 0, len(comp))
		for _, id := range comp {
			members = append(members, buildMember(id, hashByID, algoByID, subsByMember))
		}

		clusterEdges := make([]models.ClusterEdge, 0)
		for _, e := range edges {
			ai, ok := memberOf[e.AID]
			if !ok {
				continue
			}
			bi, ok := memberOf[e.BID]
			if !ok {
				continue
			}
			if ai != bi {
				continue
			}
			clusterEdges = append(clusterEdges, models.ClusterEdge{
				A:        hashByID[e.AID],
				B:        hashByID[e.BID],
				Distance: hamming(int64(hashByID[e.AID]), int64(hashByID[e.BID])),
			})
		}

		oshashes := make([]models.ClusterOshash, 0)
		for _, oshashID := range oshashOrdered {
			phashID := oshashAttach[oshashID]
			ci, ok := memberOf[phashID]
			if !ok {
				continue
			}
			if ci != memberOf[comp[0]] {
				continue
			}
			oshashes = append(oshashes, models.ClusterOshash{
				Hash:             hashByID[oshashID],
				AttachedTo:       hashByID[phashID],
				SceneSubmissions: buildSceneSubmissions(subsByMember[oshashID]),
			})
		}

		clusterID := computeClusterID(comp, hashByID)
		clusters = append(clusters, models.FingerprintCluster{
			ID:             clusterID,
			Members:        members,
			Edges:          clusterEdges,
			LinkedOshashes: oshashes,
			Scenes:         nil, // attachScenes fills this
			Tainted:        tainted,
		})
		_ = distance
	}
	return clusters
}

func buildMember(
	id int,
	hashByID map[int]models.FingerprintHash,
	algoByID map[int]models.FingerprintAlgorithm,
	subsByMember map[int][]queries.LoadClusterSubmissionsRow,
) models.ClusterMember {
	rows := subsByMember[id]
	totalSubs, totalReports := 0, 0
	for _, r := range rows {
		totalSubs += r.Submissions
		totalReports += r.Reports
	}
	return models.ClusterMember{
		Hash:             hashByID[id],
		Algorithm:        algoByID[id],
		SceneSubmissions: buildSceneSubmissions(rows),
		TotalSubmissions: totalSubs,
		TotalReports:     totalReports,
	}
}

func buildSceneSubmissions(rows []queries.LoadClusterSubmissionsRow) []models.ClusterSceneSubmission {
	out := make([]models.ClusterSceneSubmission, 0, len(rows))
	for _, r := range rows {
		out = append(out, models.ClusterSceneSubmission{
			SceneID:     r.SceneID,
			Submissions: r.Submissions,
			Reports:     r.Reports,
			Durations:   r.Durations,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Submissions != out[j].Submissions {
			return out[i].Submissions > out[j].Submissions
		}
		return out[i].SceneID.String() < out[j].SceneID.String()
	})
	return out
}

func (s *Fingerprint) attachScenes(ctx context.Context, clusters []models.FingerprintCluster) error {
	sceneIDSet := make(map[uuid.UUID]struct{})
	for _, c := range clusters {
		for _, m := range c.Members {
			for _, ss := range m.SceneSubmissions {
				sceneIDSet[ss.SceneID] = struct{}{}
			}
		}
		for _, o := range c.LinkedOshashes {
			for _, ss := range o.SceneSubmissions {
				sceneIDSet[ss.SceneID] = struct{}{}
			}
		}
	}
	if len(sceneIDSet) == 0 {
		return nil
	}
	sceneIDs := make([]uuid.UUID, 0, len(sceneIDSet))
	for id := range sceneIDSet {
		sceneIDs = append(sceneIDs, id)
	}
	scenes, err := s.queries.GetScenes(ctx, sceneIDs)
	if err != nil {
		return err
	}
	sceneByID := make(map[uuid.UUID]*models.Scene, len(scenes))
	for _, sc := range scenes {
		m := converter.SceneToModel(sc)
		sceneByID[sc.ID] = &m
	}

	for i := range clusters {
		c := &clusters[i]
		memberCount := make(map[uuid.UUID]int)
		submissionCount := make(map[uuid.UUID]int)
		for _, m := range c.Members {
			seenScene := make(map[uuid.UUID]struct{})
			for _, ss := range m.SceneSubmissions {
				if _, ok := seenScene[ss.SceneID]; !ok {
					memberCount[ss.SceneID]++
					seenScene[ss.SceneID] = struct{}{}
				}
				submissionCount[ss.SceneID] += ss.Submissions
			}
		}
		summaries := make([]models.ClusterSceneSummary, 0, len(memberCount))
		for sceneID, mc := range memberCount {
			scene, ok := sceneByID[sceneID]
			if !ok {
				continue
			}
			summaries = append(summaries, models.ClusterSceneSummary{
				Scene:           scene,
				MemberCount:     mc,
				SubmissionCount: submissionCount[sceneID],
			})
		}
		sort.Slice(summaries, func(i, j int) bool {
			if summaries[i].MemberCount != summaries[j].MemberCount {
				return summaries[i].MemberCount > summaries[j].MemberCount
			}
			return summaries[i].SubmissionCount > summaries[j].SubmissionCount
		})
		c.Scenes = summaries
	}
	return nil
}

func computeClusterID(ids []int, hashByID map[int]models.FingerprintHash) uuid.UUID {
	h := sha1.New()
	for _, id := range ids {
		var buf [8]byte
		v := uint64(hashByID[id])
		for i := 0; i < 8; i++ {
			buf[i] = byte(v >> (8 * i))
		}
		_, _ = h.Write(buf[:])
	}
	return uuid.NewV5(clusterIDNamespace, string(h.Sum(nil)))
}

func hamming(a, b int64) int {
	x := uint64(a) ^ uint64(b)
	n := 0
	for x != 0 {
		n += int(x & 1)
		x >>= 1
	}
	return n
}
