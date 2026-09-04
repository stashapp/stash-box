import type { ImageFragment, ImageTypeEnum } from "src/graphql";

export interface TypedImage {
  image: ImageFragment;
  types: ImageTypeEnum[];
  date?: string | null;
}

export const toTypedImages = (images: ImageFragment[]): TypedImage[] =>
  images.map((image) => ({
    image,
    types: image.types,
    date: image.date,
  }));
