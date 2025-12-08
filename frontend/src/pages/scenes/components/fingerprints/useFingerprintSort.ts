import { useState, useMemo } from "react";
import type { Fingerprint } from "src/graphql";
import type { SortColumn, SortDirection } from "./types";

export const useFingerprintSort = (fingerprints: Fingerprint[]) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedFingerprints = useMemo(() => {
    const fps = [...fingerprints];
    fps.sort((a, b) => {
      let compareResult = 0;

      switch (sortColumn) {
        case "algorithm":
          compareResult = a.algorithm.localeCompare(b.algorithm);
          break;
        case "hash":
          compareResult = a.hash.localeCompare(b.hash);
          break;
        case "duration":
          compareResult = a.duration - b.duration;
          break;
        case "submissions":
          compareResult = a.submissions - b.submissions;
          break;
        case "reports":
          compareResult = a.reports - b.reports;
          break;
        case "created":
          compareResult =
            new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case "updated":
          compareResult =
            new Date(a.updated).getTime() - new Date(b.updated).getTime();
          break;
      }

      return sortDirection === "asc" ? compareResult : -compareResult;
    });
    return fps;
  }, [fingerprints, sortColumn, sortDirection]);

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortedFingerprints,
  };
};
