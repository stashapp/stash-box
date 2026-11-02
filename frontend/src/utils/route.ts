import { linkOptions } from "@tanstack/react-router";
import {
  ROUTE_CATEGORY,
  ROUTE_EDIT,
  ROUTE_IMAGE,
  ROUTE_PERFORMER,
  ROUTE_SCENE,
  ROUTE_SITE,
  ROUTE_STUDIO,
  ROUTE_TAG,
  ROUTE_USER,
} from "src/constants/route";
import { isUUID } from "./general";

export const userLinkOptions = (obj: { name: string }) =>
  linkOptions({ to: ROUTE_USER, params: { name: obj.name } });

export const sceneLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_SCENE, params: { id: obj.id } });

export const studioLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_STUDIO, params: { id: obj.id } });

export const editLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_EDIT, params: { id: obj.id } });

export const imageLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_IMAGE, params: { id: obj.id } });

export const categoryLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_CATEGORY, params: { id: obj.id } });

export const tagLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_TAG, params: { id: obj.id } });

export const performerLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_PERFORMER, params: { id: obj.id } });

export const siteLinkOptions = (obj: { id: string }) =>
  linkOptions({ to: ROUTE_SITE, params: { id: obj.id } });

export type EntityLinkOptions =
  | ReturnType<typeof userLinkOptions>
  | ReturnType<typeof sceneLinkOptions>
  | ReturnType<typeof studioLinkOptions>
  | ReturnType<typeof editLinkOptions>
  | ReturnType<typeof imageLinkOptions>
  | ReturnType<typeof categoryLinkOptions>
  | ReturnType<typeof tagLinkOptions>
  | ReturnType<typeof performerLinkOptions>
  | ReturnType<typeof siteLinkOptions>;

const ROUTES_WITH_ID = [ROUTE_PERFORMER, ROUTE_SCENE, ROUTE_STUDIO, ROUTE_TAG];

// Extracts a UUID from a local URL (e.g., /performers/{id}, /scenes/{id})
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
      const prefix = route.slice(0, route.indexOf("$id"));
      if (url.pathname.toLowerCase().startsWith(prefix)) {
        const id = decodeURIComponent(
          url.pathname.slice(prefix.length).replace(/\/$/, ""),
        );
        if (isUUID(id)) return id;
      }
    }
  } catch {
    // Not a valid URL, return original text
  }

  return trimmed;
};
