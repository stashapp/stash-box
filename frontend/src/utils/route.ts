import { generatePath, matchPath } from "react-router-dom";
import {
  ROUTE_TAG,
  ROUTE_PERFORMER,
  ROUTE_CATEGORY,
  ROUTE_EDIT,
  ROUTE_STUDIO,
  ROUTE_SCENE,
  ROUTE_SITE,
  ROUTE_USER,
} from "src/constants/route";
import { isUUID } from "./general";

export const userHref = (obj: { name: string }, route: string = ROUTE_USER) =>
  generatePath(route, { name: obj.name ?? "_" });

export const sceneHref = (obj: { id: string }, route: string = ROUTE_SCENE) =>
  generatePath(route, obj);

export const studioHref = (obj: { id: string }, route: string = ROUTE_STUDIO) =>
  generatePath(route, obj);

export const editHref = (obj: { id: string }, route: string = ROUTE_EDIT) =>
  generatePath(route, obj);

export const categoryHref = (
  obj: { id: string },
  route: string = ROUTE_CATEGORY,
) => generatePath(route, obj);

export const tagHref = (obj: { id: string }, route: string = ROUTE_TAG) =>
  generatePath(route, { id: obj.id ?? "_" });

export const performerHref = (
  obj: { id: string },
  route: string = ROUTE_PERFORMER,
) => generatePath(route, obj);

export const siteHref = (obj: { id: string }, route: string = ROUTE_SITE) =>
  generatePath(route, obj);

export const createHref = (route: string, params: unknown = {}) =>
  generatePath(
    route,
    params as Record<string, string | number | boolean | undefined>,
  );

const ROUTES_WITH_ID = [ROUTE_PERFORMER, ROUTE_SCENE, ROUTE_STUDIO, ROUTE_TAG];

// Extracts a UUID from a local stash-box URL (e.g., /performers/{id}, /scenes/{id})
// Returns the UUID if found, or the original text if not a matching URL
export const extractIdFromUrl = (text: string): string => {
  const trimmed = text.trim();

  if (isUUID(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    // Only process URLs from the same origin
    if (url.origin !== window.location.origin) {
      return trimmed;
    }

    for (const route of ROUTES_WITH_ID) {
      const match = matchPath(route, url.pathname);
      if (match?.params.id && isUUID(match.params.id)) {
        return match.params.id;
      }
    }
  } catch {
    // Not a valid URL, return original text
  }

  return trimmed;
};
