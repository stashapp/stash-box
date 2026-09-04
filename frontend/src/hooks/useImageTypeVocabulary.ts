import { useMemo } from "react";
import type { CropTemplateInfo } from "src/components/cropFrame";
import { useImageTypeGroups } from "src/graphql";

/**
 * The two things a component reading someone else's labels needs: the name to
 * print, and the frame the labels claim
 *
 * For components displaying an image someone else labelled: a gallery, an edit
 * diff. The editor holds the vocabulary already and reads names straight out
 * of it rather than calling this.
 */
export const useImageTypeVocabulary = () => {
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

    const templates = new Map(
      types.flatMap((type) =>
        type.crop_template
          ? [
              [
                type.key as string,
                {
                  aspectRatio: type.crop_template.aspect_ratio,
                  guides: type.crop_template.guides,
                },
              ] as const,
            ]
          : [],
      ),
    );

    return {
      // Falls back to the key while the query is in flight, and for a type the
      // instance has switched off, which this deliberately does not ask for.
      typeName: (key: string) => names.get(key) ?? key,

      // Undefined rather than the key: a tooltip repeating the label it hangs
      // off is worse than no tooltip.
      typeDescription: (key: string) => descriptions.get(key),

      // At most one applies: crops are an exclusive group, so an image cannot
      // claim two frames and the first match is the only match.
      templateFor: (keys: string[]): CropTemplateInfo | undefined =>
        keys.map((key) => templates.get(key)).find(Boolean),
    };
  }, [data]);
};
