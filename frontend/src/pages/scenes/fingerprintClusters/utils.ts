import { ROUTE_SCENES } from "src/constants/route";
import { FingerprintAlgorithm } from "src/graphql";
import type { Cluster, ClusterMember, ClusterScene } from "./types";

/** Search route for a fingerprint hash. */
export const fingerprintSearchHref = (hash: string) =>
  `${ROUTE_SCENES}?fingerprint=${encodeURIComponent(hash)}`;

export type MoveRow = { hash: string; algorithm: FingerprintAlgorithm };

/**
 * Build the per-source-scene mutation rows for moving selected hashes. Each
 * selected phash contributes a row for every scene it lives on, plus its
 * linked OSHASHes for that scene (oshashes follow their phash).
 */
export const buildMoveSources = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): Map<string, MoveRow[]> => {
  const sources = new Map<string, MoveRow[]>();
  for (const m of cluster?.members ?? []) {
    if (!selectedHashes.has(m.hash)) continue;
    for (const s of m.scene_submissions) {
      const rows = sources.get(s.scene.id) ?? [];
      rows.push({ hash: m.hash, algorithm: FingerprintAlgorithm.PHASH });
      for (const o of s.linked_fingerprints) {
        rows.push({ hash: o.hash, algorithm: FingerprintAlgorithm.OSHASH });
      }
      sources.set(s.scene.id, rows);
    }
  }
  return sources;
};

/**
 * Count of distinct linked OSHASHes carried into the target by a selection.
 * An oshash present on several scenes appears in each scene's
 * linked_fingerprints, so we dedupe by hash. Oshashes that only exist on the
 * target scene aren't moving anywhere, so scenes matching `targetSceneId` are
 * skipped; pass it undefined (no target chosen yet) to count all linked.
 */
export const linkedFingerprintCount = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
  targetSceneId?: string,
): number => {
  const hashes = new Set<string>();
  for (const m of cluster?.members ?? []) {
    if (!selectedHashes.has(m.hash)) continue;
    for (const s of m.scene_submissions) {
      if (s.scene.id === targetSceneId) continue;
      for (const o of s.linked_fingerprints) hashes.add(o.hash);
    }
  }
  return hashes.size;
};

/** Sum of phash user-submission counts on this member across all scenes. */
export const memberTotalSubmissions = (m: ClusterMember): number =>
  m.scene_submissions.reduce((s, x) => s + x.submissions, 0);

/** Phash hashes that exist on more than one scene in the cluster. */
export const multiSceneHashes = (cluster: Cluster | undefined): string[] => {
  if (!cluster) return [];
  return cluster.members
    .filter((m) => m.scene_submissions.length > 1)
    .map((m) => m.hash);
};

/** Sum of phash user-submission counts across selected hashes. */
export const sumSelectedSubmissions = (
  cluster: Cluster | undefined,
  selectedHashes: Set<string>,
): number =>
  (cluster?.members ?? [])
    .filter((m) => selectedHashes.has(m.hash))
    .reduce((total, m) => total + memberTotalSubmissions(m), 0);

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
 * scene the cluster touches, sorted by submission count desc. Each row in
 * `scene_submissions` already represents one (member, scene) pair.
 */
export const clusterSceneSummaries = (
  cluster: Cluster | undefined,
): ClusterSceneSummary[] => {
  if (!cluster) return [];
  const byScene = cluster.members
    .flatMap((m) => m.scene_submissions)
    .reduce((acc, s) => {
      const existing = acc.get(s.scene.id) ?? {
        scene: s.scene,
        memberCount: 0,
        submissionCount: 0,
      };
      existing.memberCount++;
      existing.submissionCount += s.submissions;
      acc.set(s.scene.id, existing);
      return acc;
    }, new Map<string, ClusterSceneSummary>());
  return [...byScene.values()].sort(
    (a, b) => b.submissionCount - a.submissionCount,
  );
};
