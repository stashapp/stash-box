import type { EditsQuery } from "src/graphql";
import { ROUTE_HOME } from "src/constants/route";
import { performerHref, tagHref, studioHref, sceneHref } from "./route";

type Edits = NonNullable<EditsQuery["queryEdits"]["edits"][number]>;

type Details = Edits["details"];

type Target = NonNullable<Edits["target"]>;
type Tag = Target & { __typename: "Tag" };
type Performer = Target & { __typename: "Performer" };
type Studio = Target & { __typename: "Studio" };
type Scene = Target & { __typename: "Scene" };

interface TypeName {
  __typename: string;
}

export const isTag = (
  entity: TypeName | null | undefined,
): entity is Tag | undefined =>
  entity?.__typename === "Tag" || entity === undefined;

export const isPerformer = (
  entity: TypeName | null | undefined,
): entity is Performer | undefined =>
  entity?.__typename === "Performer" || entity === undefined;

export const isStudio = (
  entity: TypeName | null | undefined,
): entity is Studio | undefined =>
  entity?.__typename === "Studio" || entity === undefined;

export const isScene = (
  entity: TypeName | null | undefined,
): entity is Scene | undefined =>
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

export const isValidEditTarget = (
  target: Target | null | undefined,
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

export const getEditTargetName = (target?: Target | null): string => {
  if (!target) return "-";

  if (isScene(target)) {
    return target.title || target.id;
  }

  if (isPerformer(target)) {
    return `${target?.name}${
      target?.disambiguation ? " (" + target?.disambiguation + ")" : ""
    }`;
  }
  return target.name || target.id;
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
  if (isSceneEdit(details)) {
    return details.title ?? "-";
  }

  if (isPerformerEdit(details)) {
    return `${details?.name}${
      details?.disambiguation ? " (" + details?.disambiguation + ")" : ""
    }`;
  }

  return details?.name ?? "-";
};
