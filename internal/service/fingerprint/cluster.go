// Package fingerprint provides services for fingerprint clustering and analysis.
package fingerprint

import (
	"context"
	"math/bits"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

const (
	maxScenesPerCluster = 100
	maxBfsIterations    = 10
	maxClusterMembers   = 500
	// bktreeBatchSize is the per-call cap imposed by the
	// pg-spgist_hamming custom-scan path (MAX_BATCH_TARGETS = 64).
	bktreeBatchSize = 64
)

// Fingerprint is the cluster service.
type Fingerprint struct {
	queries *queries.Queries
}

// New creates a new Fingerprint service.
func New(q *queries.Queries) *Fingerprint {
	return &Fingerprint{queries: q}
}

// ClusterScenes returns the cluster(s) seeded by the given scene's phash
// fingerprints, expanded out to all phashes within `distance` Hamming and the
// scenes that host them.
func (s *Fingerprint) ClusterScenes(ctx context.Context, seedScene uuid.UUID, distance int) (*models.FingerprintClustersResult, error) {
	seedRows, err := s.queries.GetScenePhashSeeds(ctx, seedScene)
	if err != nil {
		return nil, err
	}
	if len(seedRows) == 0 {
		return &models.FingerprintClustersResult{Clusters: []models.FingerprintCluster{}}, nil
	}
	seedIDs := make([]int, len(seedRows))
	seedHashes := make([]int64, len(seedRows))
	for i, r := range seedRows {
		seedIDs[i] = r.ID
		seedHashes[i] = r.Hash
	}

	closure, truncated, err := s.expandClosure(ctx, seedScene, seedIDs, seedHashes, distance)
	if err != nil {
		return nil, err
	}
	if len(closure) == 0 {
		return &models.FingerprintClustersResult{Clusters: []models.FingerprintCluster{}}, nil
	}

	memberIDs := make([]int, 0, len(closure))
	for id := range closure {
		memberIDs = append(memberIDs, id)
	}
	sort.Ints(memberIDs)

	// All cluster members are PHASH; hashes already came back from the
	// expansion, so skip the lookup and reuse the closure map.
	hashByID := make(map[int]models.FingerprintHash, len(closure))
	for id, h := range closure {
		hashByID[id] = models.FingerprintHash(h)
	}

	// Edges are computed in Go: O(N²) popcount sweep is cheaper than the
	// round-trip for our N ≤ maxClusterMembers cap.
	edges := computeEdges(memberIDs, closure, distance)

	subs, err := s.queries.LoadClusterSubmissions(ctx, memberIDs)
	if err != nil {
		return nil, err
	}

	oshashes, err := s.loadOshashLinks(ctx, memberIDs)
	if err != nil {
		return nil, err
	}
	for id, h := range oshashes.hashesByID {
		hashByID[id] = models.FingerprintHash(h)
	}
	if len(oshashes.allIDs) > 0 {
		oshashSubs, err := s.queries.LoadClusterSubmissions(ctx, oshashes.allIDs)
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

	clusters := buildClusters(components, hashByID, subs, oshashes.byPhash)
	sceneCounts := make([]int, len(clusters))
	for i, c := range clusters {
		sceneCounts[i] = distinctSceneCount(c)
	}
	sort.Slice(clusters, func(i, j int) bool {
		if sceneCounts[i] != sceneCounts[j] {
			return sceneCounts[i] > sceneCounts[j]
		}
		return len(clusters[i].Members) > len(clusters[j].Members)
	})
	return &models.FingerprintClustersResult{Clusters: clusters, Truncated: truncated}, nil
}

// distinctSceneCount counts unique scenes a cluster touches across all member
// submissions.
func distinctSceneCount(c models.FingerprintCluster) int {
	seen := make(map[uuid.UUID]struct{})
	for _, m := range c.Members {
		for _, ss := range m.SceneSubmissions {
			seen[ss.SceneID] = struct{}{}
		}
	}
	return len(seen)
}

// expandClosure performs scene-bounded BFS. Returns id→hash for every phash
// fingerprint in the closure and `truncated=true` when any of the three
// caps (scene, member, or iteration) fired — each one means results may
// be missing reachable fingerprints.
//
// Each iteration runs the bktree probe in batches of ≤bktreeBatchSize
// (the pg-spgist_hamming custom-scan cap) and resolves the resulting
// fingerprint ids to scene ids in a second round-trip — the planner
// overestimates the custom-scan's row count, so doing the join inline
// triggers a seq scan over scene_fingerprints.
func (s *Fingerprint) expandClosure(
	ctx context.Context,
	seedScene uuid.UUID,
	seedIDs []int,
	seedHashes []int64,
	distance int,
) (map[int]int64, bool, error) {
	members := make(map[int]int64, len(seedIDs))
	for i, id := range seedIDs {
		members[id] = seedHashes[i]
	}
	scenes := map[uuid.UUID]struct{}{seedScene: {}}
	sceneCapHit := false
	memberCapHit := false

	frontier := append([]int64(nil), seedHashes...)
	iter := 0
	for ; iter < maxBfsIterations && len(frontier) > 0 && !memberCapHit; iter++ {
		// 1. Hash-adjacency probe (batched, ≤64 per call).
		candidates := make([]neighbor, 0)
		seen := make(map[int]struct{})
		for start := 0; start < len(frontier); start += bktreeBatchSize {
			end := start + bktreeBatchSize
			if end > len(frontier) {
				end = len(frontier)
			}
			rows, err := s.queries.ExpandPhashNeighbors(ctx, queries.ExpandPhashNeighborsParams{
				Hashes:   frontier[start:end],
				Distance: distance,
			})
			if err != nil {
				return nil, false, err
			}
			for _, r := range rows {
				if _, ok := seen[r.ID]; ok {
					continue
				}
				seen[r.ID] = struct{}{}
				candidates = append(candidates, neighbor{id: r.ID, hash: r.Hash})
			}
		}

		// 2. Resolve candidates' scene ids in one round-trip.
		candIDs := make([]int, len(candidates))
		for i, c := range candidates {
			candIDs[i] = c.id
		}
		sceneRows, err := s.queries.GetSceneFingerprintScenes(ctx, candIDs)
		if err != nil {
			return nil, false, err
		}
		scenesByFP := make(map[int][]uuid.UUID, len(candidates))
		newScenes := make(map[uuid.UUID]struct{})
		for _, r := range sceneRows {
			scenesByFP[r.FingerprintID] = append(scenesByFP[r.FingerprintID], r.SceneID)
			if _, ok := scenes[r.SceneID]; !ok {
				newScenes[r.SceneID] = struct{}{}
			}
		}

		acceptableIDs := make(map[int]int64, len(candidates))
		if len(scenes)+len(newScenes) > maxScenesPerCluster {
			sceneCapHit = true
			// Still accept candidates whose scenes are already in the
			// closure; just don't add new scenes.
			for _, c := range candidates {
				for _, sid := range scenesByFP[c.id] {
					if _, ok := scenes[sid]; ok {
						acceptableIDs[c.id] = c.hash
						break
					}
				}
			}
		} else {
			for sceneID := range newScenes {
				scenes[sceneID] = struct{}{}
			}
			for _, c := range candidates {
				acceptableIDs[c.id] = c.hash
			}
		}

		nextFrontier := make([]int64, 0)
		for id, h := range acceptableIDs {
			if _, ok := members[id]; ok {
				continue
			}
			if len(members) >= maxClusterMembers {
				memberCapHit = true
				break
			}
			members[id] = h
			nextFrontier = append(nextFrontier, h)
		}

		// 3. Scene co-membership: add every phash on any scene in the
		// closure (cheap — small set of scene_ids).
		if !memberCapHit {
			sceneIDs := make([]uuid.UUID, 0, len(scenes))
			for sceneID := range scenes {
				sceneIDs = append(sceneIDs, sceneID)
			}
			coMembers, err := s.queries.ExpandSceneCoMembers(ctx, sceneIDs)
			if err != nil {
				return nil, false, err
			}
			for _, r := range coMembers {
				if _, ok := members[r.ID]; ok {
					continue
				}
				if len(members) >= maxClusterMembers {
					memberCapHit = true
					break
				}
				members[r.ID] = r.Hash
				nextFrontier = append(nextFrontier, r.Hash)
			}
		}

		frontier = nextFrontier
	}

	// Iteration cap was hit if we exited the loop with work still pending.
	iterCapHit := iter == maxBfsIterations && len(frontier) > 0
	truncated := sceneCapHit || memberCapHit || iterCapHit
	return members, truncated, nil
}

// oshashLinks is the result of resolving phash members to their co-submitted
// OSHASH siblings: a phash→oshashIDs index (each oshash pinned to one phash,
// first-wins), the flat list of unique oshash ids, and their hashes.
type oshashLinks struct {
	byPhash    map[int][]int
	allIDs     []int
	hashesByID map[int]int64
}

func (s *Fingerprint) loadOshashLinks(ctx context.Context, phashMemberIDs []int) (oshashLinks, error) {
	rows, err := s.queries.LoadLinkedOshashSubmissions(ctx, phashMemberIDs)
	if err != nil {
		return oshashLinks{}, err
	}
	out := oshashLinks{
		byPhash:    make(map[int][]int),
		hashesByID: make(map[int]int64),
	}
	for _, row := range rows {
		if _, seen := out.hashesByID[row.OshashFingerprintID]; seen {
			continue
		}
		out.hashesByID[row.OshashFingerprintID] = row.OshashHash
		out.allIDs = append(out.allIDs, row.OshashFingerprintID)
		out.byPhash[row.PhashFingerprintID] = append(out.byPhash[row.PhashFingerprintID], row.OshashFingerprintID)
	}
	sort.Ints(out.allIDs)
	for _, ids := range out.byPhash {
		sort.Ints(ids)
	}
	return out, nil
}

// neighbor is a (fingerprint id, hash) pair returned by a bktree probe.
type neighbor struct {
	id   int
	hash int64
}

// clusterEdge is a within-distance pair of fingerprint ids inside a closure.
type clusterEdge struct {
	AID int
	BID int
}

// computeEdges returns every within-distance pair from the closure. Used to
// derive connected components; the frontend recomputes the same pairs from
// member hashes for graph rendering.
func computeEdges(ids []int, hashByID map[int]int64, distance int) []clusterEdge {
	edges := make([]clusterEdge, 0)
	for i := 0; i < len(ids); i++ {
		ai := ids[i]
		ah := uint64(hashByID[ai])
		for j := i + 1; j < len(ids); j++ {
			bi := ids[j]
			if bits.OnesCount64(ah^uint64(hashByID[bi])) <= distance {
				edges = append(edges, clusterEdge{AID: ai, BID: bi})
			}
		}
	}
	return edges
}

// connectedComponents groups fingerprint ids into components via union-find
// over the edge set. Isolated nodes (no edges) form singleton components.
func connectedComponents(nodes []int, edges []clusterEdge) [][]int {
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
	subs []queries.LoadClusterSubmissionsRow,
	oshashByPhash map[int][]int,
) []models.FingerprintCluster {
	subsByMember := make(map[int][]queries.LoadClusterSubmissionsRow)
	for _, row := range subs {
		subsByMember[row.FingerprintID] = append(subsByMember[row.FingerprintID], row)
	}

	clusters := make([]models.FingerprintCluster, 0, len(components))
	for _, comp := range components {
		members := make([]models.ClusterMember, 0, len(comp))
		for _, id := range comp {
			members = append(members, buildMember(id, hashByID, subsByMember, oshashByPhash))
		}
		clusters = append(clusters, models.FingerprintCluster{Members: members})
	}
	return clusters
}

func buildMember(
	id int,
	hashByID map[int]models.FingerprintHash,
	subsByMember map[int][]queries.LoadClusterSubmissionsRow,
	oshashByPhash map[int][]int,
) models.ClusterMember {
	// Group this member's linked oshashes by scene id. The same oshash (file
	// hash) can be submitted against multiple scenes — that's the duplicate
	// case this tool exists to resolve — so it has one row per scene and must
	// be attached to each, not just the first.
	oshashBySceneID := make(map[uuid.UUID][]models.ClusterOshash)
	for _, oshashID := range oshashByPhash[id] {
		for _, r := range subsByMember[oshashID] {
			oshashBySceneID[r.SceneID] = append(oshashBySceneID[r.SceneID], models.ClusterOshash{
				Hash:        hashByID[oshashID],
				Submissions: r.Submissions,
				Reports:     r.Reports,
			})
		}
	}
	return models.ClusterMember{
		Hash:             hashByID[id],
		SceneSubmissions: buildSceneSubmissions(subsByMember[id], oshashBySceneID),
	}
}

func buildSceneSubmissions(
	rows []queries.LoadClusterSubmissionsRow,
	oshashBySceneID map[uuid.UUID][]models.ClusterOshash,
) []models.ClusterSceneSubmission {
	out := make([]models.ClusterSceneSubmission, 0, len(rows))
	for _, r := range rows {
		durations := make([]models.DurationCount, 0, len(r.Durations))
		for i, d := range r.Durations {
			count := 0
			if i < len(r.DurationSubmissions) {
				count = r.DurationSubmissions[i]
			}
			durations = append(durations, models.DurationCount{
				Duration: d,
				Count:    count,
			})
		}
		out = append(out, models.ClusterSceneSubmission{
			SceneID:            r.SceneID,
			Submissions:        r.Submissions,
			Reports:            r.Reports,
			Durations:          durations,
			LinkedFingerprints: oshashBySceneID[r.SceneID],
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
