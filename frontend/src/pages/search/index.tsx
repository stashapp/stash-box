import { createRoute } from "@tanstack/react-router";
import { SearchAll } from "src/pages/search/SearchAll";
import { SearchPerformersTab } from "src/pages/search/SearchPerformersTab";
import { SearchScenesTab } from "src/pages/search/SearchScenesTab";
import { narrowRoute } from "src/routing/layouts";
import { SearchLayout } from "./SearchLayout";

export { SearchLayout as default };

const searchRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "search",
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: SearchLayout,
});

const searchAllRoute = createRoute({
  getParentRoute: () => searchRoute,
  path: "/",
  component: SearchAll,
});

const searchPerformersRoute = createRoute({
  getParentRoute: () => searchRoute,
  path: "performers",
  component: SearchPerformersTab,
});

const searchScenesRoute = createRoute({
  getParentRoute: () => searchRoute,
  path: "scenes",
  component: SearchScenesTab,
});

export const searchRoutes = searchRoute.addChildren([
  searchAllRoute,
  searchPerformersRoute,
  searchScenesRoute,
]);
