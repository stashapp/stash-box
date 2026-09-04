import type { TypedImage } from "src/components/editImages";

export type InitialStudio = {
  name?: string | null;
  aliases?: string[];
  parent?: {
    id: string;
    name: string;
  } | null;
  images?: TypedImage[];
  urls?: {
    url: string;
    site: {
      id: string;
      name: string;
    };
  }[];
};
