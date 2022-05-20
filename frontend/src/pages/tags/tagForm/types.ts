export type InitialTag = {
  name?: string | null;
  description?: string | null;
  aliases?: string[];
  category?: {
    id: string;
    name: string;
  } | null;
};
