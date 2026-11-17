import { useMemo } from "react";
import { type CropTemplate, useImageTypeGroups } from "src/graphql";

export const useImageTypeNames = () => {
  const { data } = useImageTypeGroups({ includeDisabled: true });

  return useMemo(() => {
    const groups = data?.imageTypeGroups ?? [];
    const names = new Map<string, string>();
    const templates = new Map<string, CropTemplate>();

    for (const group of groups) {
      for (const type of group.types) {
        names.set(type.key, type.name);
        if (type.crop_template) {
          templates.set(type.key, type.crop_template);
        }
      }
    }

    return {
      typeName: (key: string) => names.get(key) ?? key,
      templateFor: (keys: readonly string[]) =>
        keys.map((key) => templates.get(key)).find((t) => t !== undefined),
    };
  }, [data]);
};
