import { useMemo } from "react";
import { useImageTypeGroups } from "src/graphql";

export const useImageTypeNames = () => {
  const { data } = useImageTypeGroups({ includeDisabled: true });

  return useMemo(() => {
    const groups = data?.imageTypeGroups ?? [];
    const names = new Map<string, string>();

    for (const group of groups) {
      for (const type of group.types) {
        names.set(type.key, type.name);
      }
    }

    return {
      typeName: (key: string) => names.get(key) ?? key,
    };
  }, [data]);
};
