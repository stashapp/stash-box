import { CriterionModifier } from "src/graphql";

export const TAG_FILTER_MODES = ["all", "any", "exclude"] as const;
export type TagFilterMode = (typeof TAG_FILTER_MODES)[number];

export const TAG_FILTER_MODE_LABELS: Record<TagFilterMode, string> = {
  all: "Has all of",
  any: "Has any of",
  exclude: "Has none of",
};

const MODIFIERS: Record<TagFilterMode, CriterionModifier> = {
  all: CriterionModifier.INCLUDES_ALL,
  any: CriterionModifier.INCLUDES,
  exclude: CriterionModifier.EXCLUDES,
};

export const parseTagFilterMode = (mode?: string): TagFilterMode =>
  TAG_FILTER_MODES.find((m) => m === mode) ?? "all";

/** Builds the `tags` criterion for a query, or undefined if no tags are selected. */
export const buildTagCriterion = (ids: string[], mode: TagFilterMode) =>
  ids.length > 0 ? { value: ids, modifier: MODIFIERS[mode] } : undefined;
