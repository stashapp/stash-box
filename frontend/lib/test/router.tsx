import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterContextProvider,
  RouterProvider,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { parseSearch, stringifySearch } from "src/routing/search";

export interface TestRoute {
  path: string;
  element: ReactNode;
}

// Presentation tests need synchronous router context; navigation tests supply
// routes so that the real matching and navigation lifecycle runs.
export function TestRouter({
  children,
  initialEntries = ["/"],
  routes,
}: {
  children?: ReactNode;
  initialEntries?: string[];
  routes?: TestRoute[];
}) {
  const [router] = useState(() => {
    const root = createRootRoute();
    const routeTree = root.addChildren(
      (routes ?? []).map(({ path, element }) =>
        createRoute({
          getParentRoute: () => root,
          path,
          component: () => element,
        }),
      ),
    );
    return createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries }),
      parseSearch,
      stringifySearch,
      defaultPendingMs: 0,
      defaultPendingMinMs: 0,
    });
  });

  return routes ? (
    <RouterProvider router={router} />
  ) : (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  );
}
