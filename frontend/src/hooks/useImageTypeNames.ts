import { useMemo } from "react";
import { useImageTypeGroups } from "src/graphql";

/**
 * Resolves an image type key to what a user should see: "Portrait" rather
 * than SHOT_PORTRAIT, and the type's description for a tooltip
 *
 * `typeName` falls back to the key while the query is in flight, and for a
 * disabled type, which this does not ask for
 */
export const useImageTypeNames = () => {
  const { data } = useImageTypeGroups({});

  return useMemo(() => {
    const types = (data?.imageTypeGroups ?? []).flatMap((group) => group.types);

    const names = new Map(
      types.map((type) => [type.key as string, type.name] as const),
    );
    const descriptions = new Map(
      types.flatMap((type) =>
        type.description
          ? [[type.key as string, type.description] as const]
          : [],
      ),
    );

    return {
      typeName: (key: string) => names.get(key) ?? key,
      typeDescription: (key: string) => descriptions.get(key),
    };
  }, [data]);
};
