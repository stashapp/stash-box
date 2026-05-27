import { useState } from "react";

export const useClusterSelection = () => {
  const [selectedHashes, setSelected] = useState<Set<string>>(new Set());

  const toggle = (hash: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });

  const setMany = (hashes: string[], value: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const h of hashes) {
        if (value) next.add(h);
        else next.delete(h);
      }
      return next;
    });

  const clear = () => setSelected(new Set());
  const isSelected = (hash: string) => selectedHashes.has(hash);

  return { selectedHashes, toggle, setMany, clear, isSelected };
};
