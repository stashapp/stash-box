import type { FingerprintClustersQuery } from "src/graphql";

export type Cluster =
  FingerprintClustersQuery["fingerprintClusters"]["clusters"][number];
export type ClusterMember = Cluster["members"][number];
export type ClusterScene = ClusterMember["scene_submissions"][number]["scene"];
export type ClusterLinkedFingerprint =
  ClusterMember["scene_submissions"][number]["linked_fingerprints"][number];
