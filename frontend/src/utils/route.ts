import { generatePath } from "react-router-dom";
import { ROUTE_TAG, ROUTE_PERFORMER } from "src/constants/route";

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
