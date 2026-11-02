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
  layoutId,
}: {
  children?: ReactNode;
  initialEntries?: string[];
  routes?: TestRoute[];
  layoutId?: string;
}) {
  const [router] = useState(() => {
    const root = createRootRoute();
    const parent = layoutId
      ? createRoute({ getParentRoute: () => root, id: layoutId })
      : root;
    const children = (routes ?? []).map(({ path, element }) =>
      createRoute({
        getParentRoute: () => parent,
        path,
        component: () => element,
      }),
    );
    const routeTree = layoutId
      ? root.addChildren([parent.addChildren(children)])
      : root.addChildren(children);

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
