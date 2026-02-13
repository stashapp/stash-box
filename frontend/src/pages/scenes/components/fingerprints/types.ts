import type { Fingerprint } from "src/graphql";

export interface FingerprintTableProps {
  scene: {
    id: string;
    fingerprints: Fingerprint[];
  };
}

export type MatchType = "submission" | "report";

export type SortColumn =
  | "algorithm"
  | "hash"
  | "duration"
  | "submissions"
  | "reports"
  | "created"
  | "updated";

export type SortDirection = "asc" | "desc";
