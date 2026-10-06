import type { ImageFragment, ImageTypeEnum } from "src/graphql";

export interface TypedImage {
  image: ImageFragment;
  types: ImageTypeEnum[];
  date?: string | null;
}

export type Labelling = Pick<TypedImage, "types" | "date">;

export const toTypedImages = (images: ImageFragment[]): TypedImage[] =>
  images.map((image) => ({
    image,
    types: image.types,
    date: image.date,
  }));

export const claimedCropType = <
  T extends { key: string; crop_template?: unknown },
>(
  groups: readonly { types: readonly T[] }[],
  types: readonly string[],
): T | undefined =>
  groups
    .flatMap((group) => group.types)
    .find((t) => t.crop_template && types.includes(t.key));
