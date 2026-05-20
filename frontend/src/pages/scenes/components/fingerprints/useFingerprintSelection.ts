import { useCallback, useRef, useState } from "react";

const rangeBetween = (hashes: string[], from: string, to: string) => {
  const a = hashes.indexOf(from);
  const b = hashes.indexOf(to);
  if (a === -1 || b === -1) return [];
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return hashes.slice(lo, hi + 1);
};

export const useFingerprintSelection = () => {
  const [selectedFingerprints, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);

  const toggleFingerprint = useCallback((hash: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
    anchor.current = hash;
  }, []);

  const toggleFingerprintRange = useCallback(
    (hash: string, orderedHashes: string[]) => {
      // Capture before setSelected — React flushes the updater after the event
      // handler returns, by which point anchor.current would already be updated.
      const from = anchor.current;
      setSelected((prev) => {
        const next = new Set(prev);
        const select = !prev.has(hash);
        const range = from
          ? rangeBetween(orderedHashes, from, hash)
          : [hash];
        for (const h of range) {
          if (select) next.add(h);
          else next.delete(h);
        }
        return next;
      });
      anchor.current = hash;
    },
    [],
  );

  const toggleAllFingerprints = useCallback((orderedHashes: string[]) => {
    setSelected((prev) =>
      prev.size === 0 ? new Set(orderedHashes) : new Set(),
    );
    anchor.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    anchor.current = null;
  }, []);

  return {
    selectedFingerprints,
    toggleFingerprint,
    toggleFingerprintRange,
    toggleAllFingerprints,
    clearSelection,
  };
};
