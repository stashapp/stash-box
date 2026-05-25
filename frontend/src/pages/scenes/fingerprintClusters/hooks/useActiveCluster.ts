import { useCallback, useEffect, useMemo, useState } from "react";
import type { Cluster } from "../types";

/**
 * Tracks which cluster is currently being inspected. Auto-selects the first
 * cluster when data first arrives (or the previously-active one disappears).
 */
export const useActiveCluster = (clusters: Cluster[]) => {
  const [activeClusterId, setActiveClusterId] = useState<string | undefined>();

  useEffect(() => {
    if (clusters.length === 0) {
      setActiveClusterId(undefined);
      return;
    }
    if (!activeClusterId || !clusters.some((c) => c.id === activeClusterId)) {
      setActiveClusterId(clusters[0].id);
    }
  }, [clusters, activeClusterId]);

  const activeCluster = useMemo(
    () => clusters.find((c) => c.id === activeClusterId),
    [clusters, activeClusterId],
  );

  /** Switch the active cluster. Returns true if the id actually changed. */
  const switchTo = useCallback(
    (id: string) => {
      if (id === activeClusterId) return false;
      setActiveClusterId(id);
      return true;
    },
    [activeClusterId],
  );

  return { activeCluster, activeClusterId, switchTo };
};
