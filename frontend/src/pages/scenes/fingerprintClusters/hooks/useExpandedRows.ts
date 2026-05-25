import { useCallback, useState } from "react";

/** Simple Set<string> open/closed tracker for collapsible rows. */
export const useExpandedRows = () => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { expanded, toggle };
};
