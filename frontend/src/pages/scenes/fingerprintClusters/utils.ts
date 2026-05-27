import { ROUTE_SCENES } from "src/constants/route";
import { FingerprintAlgorithm } from "src/graphql";
import type { Cluster, ClusterMember, MemberKey } from "./types";

/** Search route for a fingerprint hash. */
export const fingerprintSearchHref = (hash: string) =>
  `${ROUTE_SCENES}?fingerprint=${encodeURIComponent(hash)}`;

/**
 * Auto-include OSHASHes attached to selected phashes on the same scene.
 * OSHASHes aren't selectable on their own; they follow their phash.
 */
export const expandWithLinkedOshashes = (
  cluster: Cluster | undefined,
  keys: MemberKey[],
): MemberKey[] => {
  if (!cluster) return keys;
  const expanded: MemberKey[] = [];
  const seen = new Set<string>();
  const push = (k: MemberKey) => {
    const id = `${k.algorithm}:${k.hash}:${k.sceneId}`;
    if (seen.has(id)) return;
    seen.add(id);
    expanded.push(k);
  };
  for (const k of keys) {
    push(k);
    if (k.algorithm !== FingerprintAlgorithm.PHASH) continue;
    for (const o of cluster.linked_oshashes) {
      if (o.attached_to !== k.hash) continue;
      if (!o.scene_submissions.some((s) => s.scene_id === k.sceneId)) continue;
      push({
        hash: o.hash,
        algorithm: FingerprintAlgorithm.OSHASH,
        sceneId: k.sceneId,
      });
    }
  }
  return expanded;
};

/** Group selected MemberKeys by source scene for per-source mutation calls. */
export const groupBySource = (
  keys: MemberKey[],
): Map<string, { hash: string; algorithm: FingerprintAlgorithm }[]> => {
  const groups = new Map<
    string,
    { hash: string; algorithm: FingerprintAlgorithm }[]
  >();
  for (const k of keys) {
    const list = groups.get(k.sceneId) ?? [];
    list.push({ hash: k.hash, algorithm: k.algorithm });
    groups.set(k.sceneId, list);
  }
  return groups;
};

/** Phash hashes that exist on more than one scene in the cluster. */
export const multiSceneHashes = (cluster: Cluster | undefined): string[] => {
  if (!cluster || cluster.poisoned) return [];
  return cluster.members
    .filter((m) => m.scene_submissions.length > 1)
    .map((m) => m.hash);
};

/** Per-scene MemberKey expansion for a set of selected hashes. */
export const expandSelectionToMemberKeys = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): MemberKey[] => {
  const keys: MemberKey[] = [];
  if (!cluster) return keys;
  for (const m of cluster.members) {
    if (!selectedHashes.has(m.hash)) continue;
    for (const s of m.scene_submissions) {
      keys.push({
        hash: m.hash,
        algorithm: m.algorithm,
        sceneId: s.scene_id,
      });
    }
  }
  return keys;
};

/** Sum of phash user-submission counts across (selected hash, scene) pairs. */
export const sumSelectedSubmissions = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): number => {
  if (!cluster) return 0;
  let total = 0;
  for (const m of cluster.members) {
    if (!selectedHashes.has(m.hash)) continue;
    for (const s of m.scene_submissions) total += s.submissions;
  }
  return total;
};

/** Selected ClusterMembers in cluster order. */
export const selectedMembers = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): ClusterMember[] =>
  cluster?.members.filter((m) => selectedHashes.has(m.hash)) ?? [];

/** Scene-id → human title map for every scene the cluster touches. */
export const sceneNameMap = (
  cluster: Cluster | undefined,
): Map<string, string> => {
  const m = new Map<string, string>();
  if (!cluster) return m;
  for (const s of cluster.scenes)
    m.set(s.scene.id, s.scene.title || "Untitled");
  return m;
};

/**
 * Move candidates are every cluster scene, sorted by submission count desc.
 * Even a fingerprint on just one (wrong) scene should be movable to a
 * different one, so we don't filter by selection.
 */
export const buildMoveCandidates = (cluster: Cluster | undefined) => {
  if (!cluster) return [];
  return cluster.scenes
    .map((s) => ({
      scene: s.scene,
      memberCount: s.member_count,
      submissionCount: s.submission_count,
    }))
    .sort((a, b) => b.submissionCount - a.submissionCount);
};

/**
 * Sum submission counts per duration across all scenes for this member.
 * Returns entries sorted by duration ascending.
 */
export const memberDurationCounts = (
  member: ClusterMember,
): [number, number][] => {
  const counts = new Map<number, number>();
  for (const s of member.scene_submissions) {
    for (let i = 0; i < s.durations.length; i++) {
      counts.set(
        s.durations[i],
        (counts.get(s.durations[i]) ?? 0) + s.duration_submissions[i],
      );
    }
  }
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
};

/** Most-submitted duration for a phash member, or null when unavailable. */
export const dominantDuration = (member: ClusterMember): number | null => {
  let dom: number | null = null;
  let domN = -1;
  for (const [d, n] of memberDurationCounts(member)) {
    if (n > domN) {
      dom = d;
      domN = n;
    }
  }
  return dom;
};
