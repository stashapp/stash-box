import type { ApolloClient } from "@apollo/client";
import type { createQueryPreloader } from "@apollo/client/react";
import {
  createRootRouteWithContext,
  createRoute,
  type ErrorComponentProps,
  Outlet,
  redirect,
  stripSearchParams,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "react-bootstrap";
import { ErrorMessage } from "src/components/fragments";
import { AppSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { ToastProvider } from "src/hooks/useToast";
import Main from "src/Main";
import Admin from "src/pages/admin/Admin";
import { loadCurrentUser } from "src/routing/auth";
import { isAdmin } from "src/utils";
import { validatePaginationSearch } from "./searchValidators";

const publicPaths = new Set([
  "/activate",
  "/register",
  "/login",
  "/forgot-password",
  "/reset-password",
]);

function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <>
      <ErrorMessage
        error={error instanceof Error ? error.message : "Failed to load page."}
      />
      <Button onClick={() => router.invalidate()}>Retry</Button>
    </>
  );
}

export const rootRoute = createRootRouteWithContext<{
  client: ApolloClient;
  preloadQuery: ReturnType<typeof createQueryPreloader>;
}>()({
  beforeLoad: async ({ context: { client }, location }) => {
    const user = await loadCurrentUser(client);
    const pathname = location.pathname.replace(/\/+$/, "") || "/";

    if (!user && !publicPaths.has(pathname)) {
      throw redirect({
        to: "/login",
        search:
          pathname === "/"
            ? {}
            : {
                redirect: location.publicHref,
              },
      });
    }
    return { user };
  },
  component: () => (
    <ToastProvider>
      <Main>
        <Title />
        <Outlet />
      </Main>
    </ToastProvider>
  ),
  pendingComponent: AppSkeleton,
  errorComponent: RouteError,
  notFoundComponent: () => <ErrorMessage error="Page not found." />,
});

export const narrowRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "narrow",
  validateSearch: validatePaginationSearch,
  search: { middlewares: [stripSearchParams({ page: 1 })] },
  component: () => (
    <div className="NarrowPage">
      <Outlet />
    </div>
  ),
});

export const adminRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "admin",
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.user))
      throw new Error("Access denied. Administrator access is required.");
  },
  component: Admin,
  notFoundComponent: () => <ErrorMessage error="Admin page not found." />,
});
