import { uniq } from "lodash-es";
import type { MergeConflict } from "src/components/mergeConflicts";
import type { TagFormData } from "./schema";
import type { InitialTag } from "./types";

// Minimal shape shared by the tag fragment and the full tag query.
type MergeableTag = {
  name: string;
  description?: string | null;
  aliases: string[];
  category?: { id: string; name: string } | null;
};

export type TagMergeConflict = MergeConflict<keyof TagFormData>;

// Builds the seed values and detected conflicts for merging the sources into
// the target. Empty target fields are filled from the first source that has a
// value; aliases are combined; the description and category are returned as
// conflicts when they differ across tags.
export const buildTagMerge = (
  target: MergeableTag,
  sources: MergeableTag[],
): { initial: InitialTag; conflicts: TagMergeConflict[] } => {
  const all = [target, ...sources];
  const conflicts: TagMergeConflict[] = [];

  const aliases = uniq([
    ...target.aliases,
    ...sources.map((t) => t.name),
    ...sources.flatMap((t) => t.aliases),
  ]);

  const description =
    all.map((t) => t.description).find((d) => d != null && d !== "") ?? null;
  const category = all.map((t) => t.category).find((c) => c != null) ?? null;

  const distinctDescriptions = uniq(
    all.map((t) => t.description).filter((d): d is string => !!d),
  );
  if (distinctDescriptions.length > 1) {
    conflicts.push({
      field: "description",
      label: "Description",
      currentKey: (v) => (v == null ? "" : String(v)),
      options: distinctDescriptions.map((value) => ({
        key: value,
        value,
        display: value,
        sources: all.filter((t) => t.description === value).map((t) => t.name),
      })),
    });
  }

  const categories = all
    .map((t) => t.category)
    .filter((c): c is { id: string; name: string } => c != null);
  const distinctCategoryIds = uniq(categories.map((c) => c.id));
  if (distinctCategoryIds.length > 1) {
    conflicts.push({
      field: "category",
      label: "Category",
      currentKey: (v) => (v as { id?: string } | null)?.id ?? "",
      options: distinctCategoryIds.map((id) => {
        const cat = categories.find((c) => c.id === id) as {
          id: string;
          name: string;
        };
        return {
          key: id,
          value: { id: cat.id, name: cat.name },
          display: cat.name,
          sources: all.filter((t) => t.category?.id === id).map((t) => t.name),
        };
      }),
    });
  }

  return {
    initial: {
      aliases,
      description,
      category: category && { id: category.id, name: category.name },
    },
    conflicts,
  };
};
