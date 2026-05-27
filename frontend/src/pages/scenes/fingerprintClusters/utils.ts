import { ROUTE_SCENES } from "src/constants/route";
import { FingerprintAlgorithm } from "src/graphql";
import type { Cluster, ClusterMember, ClusterScene, MemberKey } from "./types";

/** Search route for a fingerprint hash. */
export const fingerprintSearchHref = (hash: string) =>
  `${ROUTE_SCENES}?fingerprint=${encodeURIComponent(hash)}`;

const memberKeyId = (k: MemberKey) =>
  `${k.algorithm}:${k.hash}:${k.sceneId}`;

const dedupeKeys = (keys: MemberKey[]): MemberKey[] => {
  const seen = new Set<string>();
  return keys.filter((k) => {
    const id = memberKeyId(k);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

/**
 * Auto-include linked fingerprints (OSHASHes) attached to selected phashes
 * on the same scene. They aren't selectable on their own; they follow their
 * phash.
 */
export const expandWithLinkedFingerprints = (
  cluster: Cluster | undefined,
  keys: MemberKey[],
): MemberKey[] => {
  if (!cluster) return keys;
  const linkedByPhash = new Map(
    cluster.members.map((m) => [m.hash, m.linked_fingerprints] as const),
  );
  return dedupeKeys(
    keys.flatMap((k) => {
      if (k.algorithm !== FingerprintAlgorithm.PHASH) return [k];
      const linked = (linkedByPhash.get(k.hash) ?? [])
        .filter((o) => o.scene.id === k.sceneId)
        .map((o) => ({
          hash: o.hash,
          algorithm: FingerprintAlgorithm.OSHASH,
          sceneId: k.sceneId,
        }));
      return [k, ...linked];
    }),
  );
};

/** Sum of phash user-submission counts on this member across all scenes. */
export const memberTotalSubmissions = (m: ClusterMember): number =>
  m.scene_submissions.reduce((s, x) => s + x.submissions, 0);

/** Sum of phash user-report counts on this member across all scenes. */
export const memberTotalReports = (m: ClusterMember): number =>
  m.scene_submissions.reduce((s, x) => s + x.reports, 0);

/** Group selected MemberKeys by source scene for per-source mutation calls. */
export const groupBySource = (
  keys: MemberKey[],
): Map<string, { hash: string; algorithm: FingerprintAlgorithm }[]> =>
  keys.reduce((groups, k) => {
    const list = groups.get(k.sceneId) ?? [];
    list.push({ hash: k.hash, algorithm: k.algorithm });
    groups.set(k.sceneId, list);
    return groups;
  }, new Map<string, { hash: string; algorithm: FingerprintAlgorithm }[]>());

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
): MemberKey[] =>
  cluster?.members
    .filter((m) => selectedHashes.has(m.hash))
    .flatMap((m) =>
      m.scene_submissions.map((s) => ({
        hash: m.hash,
        algorithm: FingerprintAlgorithm.PHASH,
        sceneId: s.scene.id,
      })),
    ) ?? [];

/** Sum of phash user-submission counts across (selected hash, scene) pairs. */
export const sumSelectedSubmissions = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): number =>
  selectedMembers(cluster, selectedHashes).reduce(
    (total, m) => total + memberTotalSubmissions(m),
    0,
  );

/** Selected ClusterMembers in cluster order. */
export const selectedMembers = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): ClusterMember[] =>
  cluster?.members.filter((m) => selectedHashes.has(m.hash)) ?? [];

export interface ClusterSceneSummary {
  scene: ClusterScene;
  memberCount: number;
  submissionCount: number;
}

/**
 * Derive per-scene summaries from member submissions. One entry per distinct
 * scene the cluster touches, sorted by submission count desc.
 */
export const clusterSceneSummaries = (
  cluster: Cluster | undefined,
): ClusterSceneSummary[] => {
  if (!cluster) return [];
  const byScene = cluster.members
    .flatMap((m) => {
      const seen = new Set<string>();
      return m.scene_submissions.map((s) => {
        const firstForMember = !seen.has(s.scene.id);
        seen.add(s.scene.id);
        return { scene: s.scene, submissions: s.submissions, firstForMember };
      });
    })
    .reduce((acc, { scene, submissions, firstForMember }) => {
      const existing = acc.get(scene.id) ?? {
        scene,
        memberCount: 0,
        submissionCount: 0,
      };
      if (firstForMember) existing.memberCount++;
      existing.submissionCount += submissions;
      acc.set(scene.id, existing);
      return acc;
    }, new Map<string, ClusterSceneSummary>());
  return [...byScene.values()].sort(
    (a, b) => b.submissionCount - a.submissionCount,
  );
};

/**
 * Sum submission counts per duration across all scenes for this member.
 * Returns entries sorted by duration ascending.
 */
export const memberDurationCounts = (
  member: ClusterMember,
): [number, number][] => {
  const counts = member.scene_submissions
    .flatMap((s) => s.durations)
    .reduce(
      (acc, d) => acc.set(d.duration, (acc.get(d.duration) ?? 0) + d.count),
      new Map<number, number>(),
    );
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
};

/** Most-submitted duration for a phash member, or null when unavailable. */
export const dominantDuration = (member: ClusterMember): number | null =>
  memberDurationCounts(member).reduce<{ d: number; n: number } | null>(
    (best, [d, n]) => (best === null || n > best.n ? { d, n } : best),
    null,
  )?.d ?? null;
