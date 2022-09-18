import { GenderEnum, FingerprintAlgorithm } from "src/graphql";

export type InitialScene = {
  title?: string | null;
  details?: string | null;
  duration?: number | null;
  director?: string | null;
  date?: string | null;
  code?: string | null;
  urls?: {
    url: string;
    site: {
      id: string;
      name: string;
    };
  }[];
  images?: {
    id: string;
    width: number;
    height: number;
    url: string;
  }[];
  studio?: {
    id: string;
    name: string;
  } | null;
  fingerprints?:
    | {
        hash: string;
        algorithm: FingerprintAlgorithm;
        duration: number;
      }[]
    | null;
  tags?: {
    id: string;
    name: string;
    aliases: string[];
  }[];
  performers?:
    | {
        as: string | null;
        performer: {
          id: string;
          name: string;
          disambiguation: string | null;
          gender: GenderEnum | null;
          deleted: boolean;
        };
      }[]
    | null;
};
