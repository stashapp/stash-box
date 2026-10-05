import { useCallback, useMemo, useState } from "react";

export const useClusterSelection = () => {
  const [selectedHashes, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((hash: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  }, []);

  const setMany = useCallback((hashes: string[], value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const h of hashes) {
        if (value) next.add(h);
        else next.delete(h);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback(
    (hash: string) => selectedHashes.has(hash),
    [selectedHashes],
  );

  return useMemo(
    () => ({ selectedHashes, toggle, setMany, clear, isSelected }),
    [selectedHashes, toggle, setMany, clear, isSelected],
  );
};
