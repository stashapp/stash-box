import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_details_TagEdit as TagEdit,
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_target_Tag as Tag,
} from "src/definitions/Edits";

export const isTagTarget = (
  target: Target | null | undefined
): target is Tag | undefined =>
  target?.__typename === "Tag" || target === undefined;

export const isTagCreate = (details: Details | null): details is TagEdit =>
  details?.__typename === "TagEdit";
