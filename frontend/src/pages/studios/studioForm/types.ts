export type InitialStudio = {
  name?: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  images?: {
    id: string;
    height: number;
    width: number;
    url: string;
  }[];
  urls?: {
    url: string;
    site: {
      id: string;
      name: string;
    };
  }[];
};
