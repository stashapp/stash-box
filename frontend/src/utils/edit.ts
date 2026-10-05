import { ROUTE_HOME } from "src/constants/route";
import type { EditsQuery } from "src/graphql";
import { performerHref, sceneHref, studioHref, tagHref } from "./route";

type Edits = NonNullable<EditsQuery["queryEdits"]["edits"][number]>;

type Details = Edits["details"];

interface TypeName {
  __typename: string;
}

interface EditTargetLike extends TypeName {
  id: string;
  name?: string;
  title?: string | null;
  disambiguation?: string | null;
}

export const isTag = <T extends TypeName>(
  entity: T | null | undefined,
): entity is (T & { __typename: "Tag" }) | undefined =>
  entity?.__typename === "Tag" || entity === undefined;

export const isPerformer = <T extends TypeName>(
  entity: T | null | undefined,
): entity is (T & { __typename: "Performer" }) | undefined =>
  entity?.__typename === "Performer" || entity === undefined;

export const isStudio = <T extends TypeName>(
  entity: T | null | undefined,
): entity is (T & { __typename: "Studio" }) | undefined =>
  entity?.__typename === "Studio" || entity === undefined;

export const isScene = <T extends TypeName>(
  entity: T | null | undefined,
): entity is (T & { __typename: "Scene" }) | undefined =>
  entity?.__typename === "Scene" || entity === undefined;

export const isTagEdit = <T extends TypeName>(
  details?: T | null,
): details is T & { __typename: "TagEdit" } =>
  details?.__typename === "TagEdit";

export const isPerformerEdit = <T extends TypeName>(
  details?: T | null,
): details is T & { __typename: "PerformerEdit" } =>
  details?.__typename === "PerformerEdit";

export const isStudioEdit = <T extends TypeName>(
  details?: T | null,
): details is T & { __typename: "StudioEdit" } =>
  details?.__typename === "StudioEdit";

export const isSceneEdit = <T extends TypeName>(
  details?: T | null,
): details is T & { __typename: "SceneEdit" } =>
  details?.__typename === "SceneEdit";

export const isValidEditTarget = <T extends TypeName>(
  target: T | null | undefined,
): target is T & { __typename: "Performer" | "Tag" | "Studio" | "Scene" } =>
  (isPerformer(target) ||
    isTag(target) ||
    isStudio(target) ||
    isScene(target)) &&
  target !== undefined;

export const getEditTargetRoute = (target: EditTargetLike): string => {
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

export const getEditTargetName = (target?: EditTargetLike | null): string => {
  if (!target) return "-";

  if (isScene(target)) {
    return target.title || target.id;
  }

  if (isPerformer(target)) {
    const disambiguation = target?.disambiguation
      ? ` (${target?.disambiguation})`
      : "";
    return `${target?.name}${disambiguation}`;
  }
  return target.name || target.id;
};

export const getEditTargetEntity = <T extends TypeName>(target: T) => {
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
  if (isSceneEdit(details)) {
    return details.title ?? "-";
  }

  if (isPerformerEdit(details)) {
    const disambiguation = details?.disambiguation
      ? ` (${details?.disambiguation})`
      : "";
    return `${details?.name}${disambiguation}`;
  }

  return details?.name ?? "-";
};
