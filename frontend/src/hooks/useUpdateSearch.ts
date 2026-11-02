import { useNavigate, useSearch } from "@tanstack/react-router";
import { startTransition } from "react";

// Shared list controls may appear in several route sections.
export const useFilterSearch = () => useSearch({ strict: false });

export const useUpdateSearch = () => {
  const navigate = useNavigate();

  return (patch: Partial<ReturnType<typeof useFilterSearch>>) => {
    startTransition(() => {
      void navigate({
        to: ".",
        search: (previous) => ({ ...previous, page: undefined, ...patch }),
        hash: true,
        replace: true,
        resetScroll: false,
      });
    });
  };
};
