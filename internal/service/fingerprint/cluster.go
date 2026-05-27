// Package fingerprint provides services for fingerprint clustering and analysis.
package fingerprint

import (
	"context"
	"errors"
	"math/bits"
	"sort"

	"github.com/gofrs/uuid"

	"github.com/stashapp/stash-box/internal/converter"
	"github.com/stashapp/stash-box/internal/models"
	"github.com/stashapp/stash-box/internal/queries"
)

var ErrBktreeRequired = errors.New("bktree extension required for phash distance clustering")

const (
	maxScenesPerCluster = 10
	maxBfsIterations    = 6
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

	seedRows, err := s.queries.GetScenePhashSeeds(ctx, seedScene)
	if err != nil {
		return nil, err
	}
	if len(seedRows) == 0 {
		return []models.FingerprintCluster{}, nil
	}
	seedIDs := make([]int, len(seedRows))
	seedHashes := make([]int64, len(seedRows))
	for i, r := range seedRows {
		seedIDs[i] = r.ID
		seedHashes[i] = r.Hash
	}

	closure, poisoned, err := s.expandClosure(ctx, seedScene, seedIDs, seedHashes, distance)
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

	// All cluster members are PHASH; hashes already came back from the
	// expansion, so skip the lookup and reuse the closure map.
	hashByID := make(map[int]models.FingerprintHash, len(closure))
	for id, h := range closure {
		hashByID[id] = models.FingerprintHash(h)
	}

	// Edges are computed in Go — we already have every cluster member's
	// hash, so a single O(N²) Hamming sweep is faster than a round-trip
	// (and lets us drop the LoadClusterEdges SQL query entirely).
	edges := computeEdges(memberIDs, closure, distance)

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

	sceneByID, err := s.loadScenes(ctx, subs)
	if err != nil {
		return nil, err
	}

	clusters := buildClusters(components, hashByID, subs, linkedOshashes, sceneByID, poisoned)
	sort.Slice(clusters, func(i, j int) bool {
		ai, aj := distinctSceneCount(clusters[i]), distinctSceneCount(clusters[j])
		if ai != aj {
			return ai > aj
		}
		return len(clusters[i].Members) > len(clusters[j].Members)
	})
	return clusters, nil
}

// distinctSceneCount counts unique scenes a cluster touches across all member
// submissions.
func distinctSceneCount(c models.FingerprintCluster) int {
	seen := make(map[uuid.UUID]struct{})
	for _, m := range c.Members {
		for _, ss := range m.SceneSubmissions {
			seen[ss.Scene.ID] = struct{}{}
		}
	}
	return len(seen)
}

// loadScenes resolves all scene_ids referenced by the submission rows in one
// query, returning a sceneID → *Scene map for inline embedding.
func (s *Fingerprint) loadScenes(ctx context.Context, subs []queries.LoadClusterSubmissionsRow) (map[uuid.UUID]*models.Scene, error) {
	sceneIDSet := make(map[uuid.UUID]struct{})
	for _, r := range subs {
		sceneIDSet[r.SceneID] = struct{}{}
	}
	if len(sceneIDSet) == 0 {
		return map[uuid.UUID]*models.Scene{}, nil
	}
	sceneIDs := make([]uuid.UUID, 0, len(sceneIDSet))
	for id := range sceneIDSet {
		sceneIDs = append(sceneIDs, id)
	}
	scenes, err := s.queries.GetScenes(ctx, sceneIDs)
	if err != nil {
		return nil, err
	}
	out := make(map[uuid.UUID]*models.Scene, len(scenes))
	for _, sc := range scenes {
		m := converter.SceneToModel(sc)
		out[sc.ID] = &m
	}
	return out, nil
}

// expandClosure performs scene-bounded BFS. Returns id→hash for every
// phash fingerprint in the closure plus whether expansion hit the
// scene-count or member-count poison limit.
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
	poisoned := false

	frontier := append([]int64(nil), seedHashes...)
	for iter := 0; iter < maxBfsIterations && len(frontier) > 0 && !poisoned; iter++ {
		// 1. Hash-adjacency probe (batched, ≤64 per call).
		type candidate struct {
			id   int
			hash int64
		}
		candidates := make([]candidate, 0)
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
				candidates = append(candidates, candidate{id: r.ID, hash: r.Hash})
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
			poisoned = true
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
				poisoned = true
				break
			}
			members[id] = h
			nextFrontier = append(nextFrontier, h)
		}

		// 3. Scene co-membership: add every phash on any scene in the
		// closure (cheap — small set of scene_ids).
		if !poisoned {
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
					poisoned = true
					break
				}
				members[r.ID] = r.Hash
				nextFrontier = append(nextFrontier, r.Hash)
			}
		}

		frontier = nextFrontier
	}

	return members, poisoned, nil
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
	oshashLinks []queries.LoadLinkedOshashSubmissionsRow,
	sceneByID map[uuid.UUID]*models.Scene,
	poisoned bool,
) []models.FingerprintCluster {
	subsByMember := make(map[int][]queries.LoadClusterSubmissionsRow)
	for _, row := range subs {
		subsByMember[row.FingerprintID] = append(subsByMember[row.FingerprintID], row)
	}

	// Pin each oshash to one phash member (first-wins for determinism).
	oshashByPhash := make(map[int][]int)
	oshashSeen := make(map[int]struct{})
	for _, row := range oshashLinks {
		if _, ok := oshashSeen[row.OshashFingerprintID]; ok {
			continue
		}
		oshashSeen[row.OshashFingerprintID] = struct{}{}
		oshashByPhash[row.PhashFingerprintID] = append(oshashByPhash[row.PhashFingerprintID], row.OshashFingerprintID)
	}
	for _, ids := range oshashByPhash {
		sort.Ints(ids)
	}

	clusters := make([]models.FingerprintCluster, 0, len(components))
	for _, comp := range components {
		members := make([]models.ClusterMember, 0, len(comp))
		for _, id := range comp {
			members = append(members, buildMember(id, hashByID, subsByMember, oshashByPhash, sceneByID))
		}

		clusters = append(clusters, models.FingerprintCluster{
			Members:  members,
			Poisoned: poisoned,
		})
	}
	return clusters
}

func buildMember(
	id int,
	hashByID map[int]models.FingerprintHash,
	subsByMember map[int][]queries.LoadClusterSubmissionsRow,
	oshashByPhash map[int][]int,
	sceneByID map[uuid.UUID]*models.Scene,
) models.ClusterMember {
	oshashes := make([]models.ClusterOshash, 0, len(oshashByPhash[id]))
	for _, oshashID := range oshashByPhash[id] {
		// OSHASH is user+scene scoped, so each linked oshash has exactly one row.
		rows := subsByMember[oshashID]
		if len(rows) == 0 {
			continue
		}
		r := rows[0]
		scene, ok := sceneByID[r.SceneID]
		if !ok {
			continue
		}
		oshashes = append(oshashes, models.ClusterOshash{
			Hash:        hashByID[oshashID],
			Scene:       scene,
			Submissions: r.Submissions,
			Reports:     r.Reports,
		})
	}
	return models.ClusterMember{
		Hash:               hashByID[id],
		SceneSubmissions:   buildSceneSubmissions(subsByMember[id], sceneByID),
		LinkedFingerprints: oshashes,
	}
}

func buildSceneSubmissions(rows []queries.LoadClusterSubmissionsRow, sceneByID map[uuid.UUID]*models.Scene) []models.ClusterSceneSubmission {
	out := make([]models.ClusterSceneSubmission, 0, len(rows))
	for _, r := range rows {
		scene, ok := sceneByID[r.SceneID]
		if !ok {
			continue
		}
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
			Scene:       scene,
			Submissions: r.Submissions,
			Reports:     r.Reports,
			Durations:   durations,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Submissions != out[j].Submissions {
			return out[i].Submissions > out[j].Submissions
		}
		return out[i].Scene.ID.String() < out[j].Scene.ID.String()
	})
	return out
}

