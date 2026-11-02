import type { ApolloClient } from "@apollo/client";
import { createQueryPreloader } from "@apollo/client/react";
import {
  createRoute,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import Login from "src/Login";
import ActivateUser from "src/pages/activateUser";
import { adminRoutes } from "src/pages/admin";
import { categoryRoutes } from "src/pages/categories";
import { draftRoutes } from "src/pages/drafts";
import { editRoutes } from "src/pages/edits";
import ForgotPassword from "src/pages/forgotPassword";
import Home from "src/pages/home";
import ImagePage from "src/pages/image";
import { imageReviewRoutes } from "src/pages/imageReview";
import Notifications from "src/pages/notifications";
import { performerRoutes } from "src/pages/performers";
import RegisterUser from "src/pages/registerUser";
import ResetPassword from "src/pages/resetPassword";
import { sceneRoutes } from "src/pages/scenes";
import { searchRoutes } from "src/pages/search";
import { siteCategoryRoutes } from "src/pages/siteCategories";
import { siteRoutes } from "src/pages/sites";
import { studioRoutes } from "src/pages/studios";
import { tagRoutes } from "src/pages/tags";
import { userRoutes } from "src/pages/users";
import Version from "src/pages/version";
import { parseSearch, stringifySearch } from "src/routing/search";
import { narrowRoute, rootRoute } from "./layouts";
import {
  validateActivationSearch,
  validateLoginSearch,
  validateNotificationSearch,
} from "./searchValidators";

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const loginRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "login",
  validateSearch: validateLoginSearch,
  staticData: { public: true },
  component: Login,
});

const activateRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "activate",
  validateSearch: validateActivationSearch,
  staticData: { public: true },
  component: ActivateUser,
});

const registerRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "register",
  staticData: { public: true },
  component: RegisterUser,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "forgot-password",
  staticData: { public: true },
  component: ForgotPassword,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "reset-password",
  validateSearch: validateActivationSearch,
  staticData: { public: true },
  component: ResetPassword,
});

const versionRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "version",
  component: Version,
});

const imageRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "image/$id",
  component: ImagePage,
});

const imageEditRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "image/$id/edit",
  component: () => <ImagePage editing />,
});

const notificationsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "notifications",
  validateSearch: validateNotificationSearch,
  component: Notifications,
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  narrowRoute.addChildren([
    loginRoute,
    activateRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    performerRoutes,
    sceneRoutes,
    studioRoutes,
    tagRoutes,
    categoryRoutes,
    siteRoutes,
    siteCategoryRoutes,
    userRoutes,
    draftRoutes,
    editRoutes,
    imageReviewRoutes,
    searchRoutes,
    versionRoute,
    imageRoute,
    imageEditRoute,
    notificationsRoute,
    adminRoutes,
  ]),
]);

export const createAppRouter = (
  client: ApolloClient,
  history?: RouterHistory,
) =>
  createRouter({
    routeTree,
    context: { client, preloadQuery: createQueryPreloader(client) },
    history,
    basepath: import.meta.env.BASE_URL,
    parseSearch,
    stringifySearch,
    defaultPreload: "intent",
    // Delegate each preload to Apollo; cache-first can still satisfy it locally.
    // router.invalidate() reruns loaders, not necessarily network requests (see README.md).
    defaultPreloadStaleTime: 0,
    // Apollo retains query data; route matches don't need a second cache lifetime.
    defaultGcTime: 0,
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
