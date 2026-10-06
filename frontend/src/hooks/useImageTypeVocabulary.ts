import { useMemo } from "react";
import type { CropTemplateInfo } from "src/components/cropFrame";
import {
  type ImageTypeGroupsQueryVariables,
  useImageTypeGroups,
} from "src/graphql";

/**
 * The two things a component reading someone else's labels needs: the name to
 * print, and the frame the labels claim
 *
 * For components displaying an image someone else labelled: a gallery, an edit
 * diff. The editor holds the vocabulary already and reads names straight out
 * of it rather than calling this.
 *
 * Anything that shows existing labels should pass `includeDisabled`, since
 * switching a type off does not remove it from the images that already have it
 */
export const useImageTypeVocabulary = (
  variables: ImageTypeGroupsQueryVariables = {},
) => {
  const { data } = useImageTypeGroups(variables);

  return useMemo(() => {
    const groups = data?.imageTypeGroups ?? [];
    const types = groups.flatMap((group) => group.types);

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
      groups,
      typeName: (key: string) => names.get(key) ?? key,
      typeDescription: (key: string) => descriptions.get(key),
      templateFor: (keys: string[]): CropTemplateInfo | undefined =>
        keys.map((key) => templates.get(key)).find(Boolean),
    };
  }, [data]);
};
