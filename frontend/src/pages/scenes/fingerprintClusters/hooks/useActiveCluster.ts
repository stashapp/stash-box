import { useEffect, useState } from "react";
import type { Cluster } from "../types";

/**
 * Tracks which cluster index is being inspected in the picker. Resets to 0
 * whenever the clusters array changes (e.g., on refetch).
 */
export const useActiveCluster = (clusters: Cluster[]) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [clusters]);

  /** Switch the active cluster. Returns true if the index actually changed. */
  const switchTo = (index: number) => {
    if (index === activeIndex) return false;
    setActiveIndex(index);
    return true;
  };

  return { activeCluster: clusters[activeIndex], activeIndex, switchTo };
};
