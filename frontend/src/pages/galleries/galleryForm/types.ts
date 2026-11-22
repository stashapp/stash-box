import type { GenderEnum, ImageFragment, TagFragment } from "src/graphql";

export type InitialGallery = {
  title?: string | null;
  code?: string | null;
  date?: string | null;
  photographer?: string | null;
  details?: string | null;
  studio?: { id: string; name: string } | null;
  urls?: {
    url: string;
    site: { id: string; name: string; icon: string };
  }[];
  cover?: ImageFragment | null;
  tags?: TagFragment[];
  performers?: {
    as?: string | null;
    performer: {
      id: string;
      name: string;
      aliases?: string[] | null;
      disambiguation?: string | null;
      gender?: GenderEnum | null;
      deleted: boolean;
    };
  }[];
  scenes?: {
    id: string;
    title?: string | null;
    release_date?: string | null;
    deleted: boolean;
  }[];
  images?: {
    index: number;
    phash: string;
    tags: TagFragment[];
  }[];
};
