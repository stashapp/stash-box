import {
  Edits_queryEdits_edits_details_TagEdit as TagEdit,
  Edits_queryEdits_edits_details_PerformerEdit as PerformerEdit,
  Edits_queryEdits_edits_old_details_TagEdit as OldTagEdit,
  Edits_queryEdits_edits_old_details_PerformerEdit as OldPerformerEdit,
  Edits_queryEdits_edits_target_Tag as Tag,
  Edits_queryEdits_edits_target_Performer as Performer,
} from "src/definitions/Edits";

interface TypeName {
  __typename: string;
}

export const isTag = (
  entity: TypeName | null | undefined
): entity is Tag | undefined =>
  entity?.__typename === "Tag" || entity === undefined;

export const isPerformer = (
  entity: TypeName | null | undefined
): entity is Performer | undefined =>
  entity?.__typename === "Performer" || entity === undefined;

export const isTagDetails = (details?: TypeName | null): details is TagEdit =>
  details?.__typename === "TagEdit";

export const isPerformerDetails = (
  details?: TypeName | null
): details is PerformerEdit => details?.__typename === "PerformerEdit";

export const isTagOldDetails = (
  details?: TypeName | null
): details is OldTagEdit => details?.__typename === "TagEdit";

export const isPerformerOldDetails = (
  details?: TypeName | null
): details is OldPerformerEdit => details?.__typename === "PerformerEdit";
