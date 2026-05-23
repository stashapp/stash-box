import type { FingerprintClustersQuery } from "src/graphql";

const PALETTE = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
  "#9c755f",
  "#bab0ac",
];

export const sceneColor = (sceneId: string, palette: Map<string, string>) => {
  const existing = palette.get(sceneId);
  if (existing) return existing;
  const c = PALETTE[palette.size % PALETTE.length];
  palette.set(sceneId, c);
  return c;
};

export type Cluster = FingerprintClustersQuery["fingerprintClusters"][number];
export type ClusterMember = Cluster["members"][number];
export type ClusterEdge = Cluster["edges"][number];
export type ClusterSceneSummary = Cluster["scenes"][number];
export type ClusterOshashLink = Cluster["linked_oshashes"][number];
export type ClusterSubmission = ClusterMember["scene_submissions"][number];

export interface MemberKey {
  hash: string;
  algorithm: string;
  sceneId: string;
}

export const memberKeyId = (k: MemberKey) =>
  `${k.algorithm}:${k.hash}:${k.sceneId}`;
