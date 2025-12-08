import { useState, useCallback } from "react";

export const useFingerprintSelection = () => {
  const [selectedFingerprints, setSelectedFingerprints] = useState<Set<string>>(
    new Set(),
  );

  const toggleFingerprintSelection = useCallback((hash: string) => {
    setSelectedFingerprints((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFingerprints(new Set());
  }, []);

  return {
    selectedFingerprints,
    toggleFingerprintSelection,
    clearSelection,
  };
};
