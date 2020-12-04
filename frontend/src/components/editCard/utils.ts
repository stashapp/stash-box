import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_details_TagEdit as TagEdit,
  Edits_queryEdits_edits_details_PerformerEdit as PerformerEdit,
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_target_Tag as Tag,
  Edits_queryEdits_edits_target_Performer as Performer,
} from "src/definitions/Edits";

export const isTagTarget = (
  target: Target | null | undefined
): target is Tag | undefined =>
  target?.__typename === "Tag" || target === undefined;

export const isPerformerTarget = (
  target: Target | null | undefined
): target is Performer | undefined =>
  target?.__typename === "Performer" || target === undefined;

export const isTagCreate = (details: Details | null): details is TagEdit =>
  details?.__typename === "TagEdit";

export const isPerformerCreate = (details: Details | null): details is PerformerEdit =>
  details?.__typename === "PerformerEdit";
