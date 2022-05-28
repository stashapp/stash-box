import {
  Edits_queryEdits_edits_details as Details,
  Edits_queryEdits_edits_details_TagEdit as TagEdit,
  Edits_queryEdits_edits_details_PerformerEdit as PerformerEdit,
  Edits_queryEdits_edits_details_StudioEdit as StudioEdit,
  Edits_queryEdits_edits_details_SceneEdit as SceneEdit,
  Edits_queryEdits_edits_old_details_TagEdit as OldTagEdit,
  Edits_queryEdits_edits_old_details_PerformerEdit as OldPerformerEdit,
  Edits_queryEdits_edits_old_details_StudioEdit as OldStudioEdit,
  Edits_queryEdits_edits_old_details_SceneEdit as OldSceneEdit,
  Edits_queryEdits_edits_target as Target,
  Edits_queryEdits_edits_target_Studio as Studio,
  Edits_queryEdits_edits_target_Tag as Tag,
  Edits_queryEdits_edits_target_Performer as Performer,
  Edits_queryEdits_edits_target_Scene as Scene,
} from "src/graphql/definitions/Edits";
import { ROUTE_HOME } from "src/constants/route";
import { performerHref, tagHref, studioHref, sceneHref } from "./route";

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

export const isStudio = (
  entity: TypeName | null | undefined
): entity is Studio | undefined =>
  entity?.__typename === "Studio" || entity === undefined;

export const isStudioDetails = (
  details?: TypeName | null
): details is StudioEdit => details?.__typename === "StudioEdit";

export const isStudioOldDetails = (
  details?: TypeName | null
): details is OldStudioEdit => details?.__typename === "StudioEdit";

export const isTagOldDetails = (
  details?: TypeName | null
): details is OldTagEdit => details?.__typename === "TagEdit";

export const isPerformerOldDetails = (
  details?: TypeName | null
): details is OldPerformerEdit => details?.__typename === "PerformerEdit";

export const isScene = (
  entity: TypeName | null | undefined
): entity is Scene | undefined =>
  entity?.__typename === "Scene" || entity === undefined;

export const isSceneDetails = (
  details?: TypeName | null
): details is SceneEdit => details?.__typename === "SceneEdit";

export const isSceneOldDetails = (
  details?: TypeName | null
): details is OldSceneEdit => details?.__typename === "SceneEdit";

export const isValidEditTarget = (
  target: Target | null | undefined
): target is Performer | Tag | Studio | Scene =>
  (isPerformer(target) ||
    isTag(target) ||
    isStudio(target) ||
    isScene(target)) &&
  target !== undefined;

export const getEditTargetRoute = (target: Target): string => {
  if (isTag(target)) {
    return tagHref(target);
  }
  if (isPerformer(target)) {
    return performerHref(target);
  }
  if (isStudio(target)) {
    return studioHref(target);
  }
  if (isScene(target)) {
    return sceneHref(target);
  }

  return ROUTE_HOME;
};

export const getEditTargetName = (target: Target | null): string => {
  if (isScene(target)) {
    return target.title || target.id;
  }

  return target?.name || target?.id || "-";
};

export const getEditTargetEntity = (target: Target) => {
  if (isTag(target)) {
    return "Tag";
  }
  if (isPerformer(target)) {
    return "Performer";
  }
  if (isStudio(target)) {
    return "Studio";
  }
  if (isScene(target)) {
    return "Scene";
  }
};

export const getEditDetailsName = (details: Details | null): string => {
  if (isSceneDetails(details)) {
    return details.title ?? "-";
  }

  return details?.name ?? "-";
};
