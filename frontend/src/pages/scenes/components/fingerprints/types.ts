import type { Fingerprint } from "src/graphql";

export interface FingerprintTableProps {
  scene: {
    id: string;
    fingerprints: Fingerprint[];
  };
}

export type MatchType = "submission";

export type SortColumn =
  | "algorithm"
  | "hash"
  | "duration"
  | "submissions"
  | "created"
  | "updated";

export type SortDirection = "asc" | "desc";
