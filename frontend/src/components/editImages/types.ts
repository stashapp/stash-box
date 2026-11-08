import type { ImageTypeGroupsQuery } from "src/graphql";

export type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

export const claimedCropType = (
  groups: readonly ImageTypeGroup[],
  types: readonly string[],
) =>
  groups
    .flatMap((group) => group.types)
    .find((t) => t.crop_template && types.includes(t.key));
