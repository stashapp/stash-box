import type { ImageTypeEnum } from "src/graphql";

export interface ImageCategorization {
  types: ImageTypeEnum[];
  date?: string | null;
}
