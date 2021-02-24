import { generatePath } from "react-router-dom";
import {
  ROUTE_TAG,
  ROUTE_PERFORMER,
  ROUTE_CATEGORY,
  ROUTE_EDIT,
  ROUTE_STUDIO,
  ROUTE_SCENE,
  ROUTE_USER,
} from "src/constants/route";

export const userHref = (obj: { name: string }, route: string = ROUTE_USER) =>
  generatePath(route, obj);

export const sceneHref = (obj: { id: string }, route: string = ROUTE_SCENE) =>
  generatePath(route, obj);

export const studioHref = (obj: { id: string }, route: string = ROUTE_STUDIO) =>
  generatePath(route, obj);

export const editHref = (obj: { id: string }, route: string = ROUTE_EDIT) =>
  generatePath(route, obj);

export const categoryHref = (
  obj: { id: string },
  route: string = ROUTE_CATEGORY
) => generatePath(route, obj);

export const tagHref = (obj: { id: string }, route: string = ROUTE_TAG) =>
  generatePath(route, obj);

export const performerHref = (
  obj: { id: string },
  route: string = ROUTE_PERFORMER
) => generatePath(route, obj);

export const createHref = (route: string, params: Object = {}) =>
  generatePath(
    route,
    params as Record<string, string | number | undefined | boolean>
  );
