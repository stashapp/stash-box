export const claimedCropType = <
  T extends { key: string; crop_template?: unknown },
>(
  groups: readonly { types: readonly T[] }[],
  types: readonly string[],
): T | undefined =>
  groups
    .flatMap((group) => group.types)
    .find((t) => t.crop_template && types.includes(t.key));
