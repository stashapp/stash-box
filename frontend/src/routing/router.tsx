import type { ApolloClient } from "@apollo/client";
import { createQueryPreloader } from "@apollo/client/react";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  type ErrorComponentProps,
  Outlet,
  type RouterHistory,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "react-bootstrap";
import { ErrorMessage } from "src/components/fragments";
import { AppSkeleton, PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import {
  CategoryDocument,
  DraftDocument,
  FullPerformerDocument,
  PublicUserDocument,
  SceneDocument,
  SiteCategoryDocument,
  SiteDocument,
  StudioDocument,
  TagDocument,
  UserDocument,
} from "src/graphql";
import { ToastProvider } from "src/hooks/useToast";
import Login from "src/Login";
import Main from "src/Main";
import ActivateUser from "src/pages/activateUser";
import Admin, { AdminOverview } from "src/pages/admin";
import { AuditListPage } from "src/pages/audits";
import {
  CategoryAddPage,
  CategoryDetailPage,
  CategoryEditPage,
  CategoryListPage,
} from "src/pages/categories";
import { DraftDetailPage, DraftListPage } from "src/pages/drafts";
import {
  EditAmendPage,
  EditDetailPage,
  EditListPage,
  EditUpdatePage,
} from "src/pages/edits";
import ForgotPassword from "src/pages/forgotPassword";
import Home from "src/pages/home";
import ImagePage from "src/pages/image";
import { ImageReviewPage } from "src/pages/imageReview";
import ImageTypes from "src/pages/imageTypes";
import Notifications from "src/pages/notifications";
import {
  PerformerAddPage,
  PerformerDeletePage,
  PerformerDetailPage,
  PerformerEditPage,
  PerformerListPage,
  PerformerMergePage,
} from "src/pages/performers";
import RegisterUser from "src/pages/registerUser";
import ResetPassword from "src/pages/resetPassword";
import {
  SceneAddPage,
  SceneDeletePage,
  SceneDetailPage,
  SceneEditPage,
  SceneFingerprintsPage,
  SceneListPage,
} from "src/pages/scenes";
import SearchLayout from "src/pages/search";
import { SearchAll } from "src/pages/search/SearchAll";
import { SearchPerformersTab } from "src/pages/search/SearchPerformersTab";
import { SearchScenesTab } from "src/pages/search/SearchScenesTab";
import {
  SiteCategoryAddPage,
  SiteCategoryDetailPage,
  SiteCategoryEditPage,
  SiteCategoryListPage,
} from "src/pages/siteCategories";
import {
  SiteAddPage,
  SiteDetailPage,
  SiteEditPage,
  SiteListPage,
} from "src/pages/sites";
import {
  StudioAddPage,
  StudioDeletePage,
  StudioDetailPage,
  StudioEditPage,
  StudioListPage,
} from "src/pages/studios";
import {
  TagAddPage,
  TagDeletePage,
  TagDetailPage,
  TagEditPage,
  TagListPage,
  TagMergePage,
} from "src/pages/tags";
import {
  UserAddPage,
  UserChangeEmailPage,
  UserChangePasswordPage,
  UserConfirmEmailPage,
  UserDetailPage,
  UserEditPage,
  UserEditsPage,
  UserFingerprintsPage,
  UserImageTypesPage,
  UserListPage,
  UserNotificationsPage,
} from "src/pages/users";
import Version from "src/pages/version";
import { isAdmin } from "src/utils";
import { loadCurrentUser } from "./auth";
import { requireEntity } from "./requireEntity";
import { parseSearch, stringifySearch } from "./search";

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
  validateSearch: (search: Record<string, unknown>) => search,
  beforeLoad: async ({ context: { client }, location }) => {
    const user = await loadCurrentUser(client);
    if (!user && !publicPaths.has(location.pathname)) {
      throw redirect({
        to: "/login",
        search:
          location.pathname === "/"
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

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
const narrowRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "narrow",
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
const adminOverviewRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: AdminOverview,
});
const imageTypesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "image-types",
  component: ImageTypes,
});

const performersRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "performers",
});
const performersListRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "/",
  component: PerformerListPage,
});
const performersAddRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "add",
  component: PerformerAddPage,
});
const performersEntityRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(FullPerformerDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: FullPerformerDocument, variables })
        ?.findPerformer,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="performer" label="Loading performer" />
  ),
  notFoundComponent: () => <ErrorMessage error="Performer not found." />,
  component: Outlet,
});
const performersMergeRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "merge",
  component: PerformerMergePage,
});
const performersDeleteRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "delete",
  component: PerformerDeletePage,
});
const performersEditRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "edit",
  component: PerformerEditPage,
});
const performersDetailRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "/",
  component: PerformerDetailPage,
});

const scenesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "scenes",
});
const scenesAddRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "add",
  component: SceneAddPage,
});
const scenesListRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "/",
  component: SceneListPage,
});
const scenesEntityRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(SceneDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SceneDocument, variables })?.findScene,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="scene" label="Loading scene" />,
  notFoundComponent: () => <ErrorMessage error="Scene not found." />,
  component: Outlet,
});
const scenesDeleteRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "delete",
  component: SceneDeletePage,
});
const scenesEditRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "edit",
  component: SceneEditPage,
});
const scenesFingerprintsRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "fingerprints",
  component: SceneFingerprintsPage,
});
const scenesDetailRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "/",
  component: SceneDetailPage,
});

const studiosRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "studios",
});
const studiosAddRoute = createRoute({
  getParentRoute: () => studiosRoute,
  path: "add",
  component: StudioAddPage,
});
const studiosListRoute = createRoute({
  getParentRoute: () => studiosRoute,
  path: "/",
  component: StudioListPage,
});
const studiosEntityRoute = createRoute({
  getParentRoute: () => studiosRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(StudioDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: StudioDocument, variables })?.findStudio,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="studio" label="Loading studio" />,
  notFoundComponent: () => <ErrorMessage error="Studio not found." />,
  component: Outlet,
});
const studiosDeleteRoute = createRoute({
  getParentRoute: () => studiosEntityRoute,
  path: "delete",
  component: StudioDeletePage,
});
const studiosEditRoute = createRoute({
  getParentRoute: () => studiosEntityRoute,
  path: "edit",
  component: StudioEditPage,
});
const studiosDetailRoute = createRoute({
  getParentRoute: () => studiosEntityRoute,
  path: "/",
  component: StudioDetailPage,
});

const tagsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "tags",
});
const tagsListRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "/",
  component: TagListPage,
});
const tagsAddRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "add",
  component: TagAddPage,
});
const tagsEntityRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(TagDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(client.readQuery({ query: TagDocument, variables })?.findTag);
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading tag" />,
  notFoundComponent: () => <ErrorMessage error="Tag not found." />,
  component: Outlet,
});
const tagsMergeRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "merge",
  component: TagMergePage,
});
const tagsDeleteRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "delete",
  component: TagDeletePage,
});
const tagsEditRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "edit",
  component: TagEditPage,
});
const tagsDetailRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "/",
  component: TagDetailPage,
});

const categoriesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "categories",
});
const categoriesListRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "/",
  component: CategoryListPage,
});
const categoriesAddRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "add",
  component: CategoryAddPage,
});
const categoriesEntityRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(CategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: CategoryDocument, variables })?.findTagCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading category" />
  ),
  notFoundComponent: () => <ErrorMessage error="Category not found." />,
  component: Outlet,
});
const categoriesEditRoute = createRoute({
  getParentRoute: () => categoriesEntityRoute,
  path: "edit",
  component: () => <CategoryEditPage from="/narrow/categories/$id" />,
});
const categoriesDetailRoute = createRoute({
  getParentRoute: () => categoriesEntityRoute,
  path: "/",
  component: () => <CategoryDetailPage from="/narrow/categories/$id" />,
});

const sitesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "sites",
});
const sitesListRoute = createRoute({
  getParentRoute: () => sitesRoute,
  path: "/",
  component: SiteListPage,
});
const sitesAddRoute = createRoute({
  getParentRoute: () => sitesRoute,
  path: "add",
  component: SiteAddPage,
});
const sitesEntityRoute = createRoute({
  getParentRoute: () => sitesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(SiteDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SiteDocument, variables })?.findSite,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading site" />,
  notFoundComponent: () => <ErrorMessage error="Site not found." />,
  component: Outlet,
});
const sitesEditRoute = createRoute({
  getParentRoute: () => sitesEntityRoute,
  path: "edit",
  component: () => <SiteEditPage from="/narrow/sites/$id" />,
});
const sitesDetailRoute = createRoute({
  getParentRoute: () => sitesEntityRoute,
  path: "/",
  component: () => <SiteDetailPage from="/narrow/sites/$id" />,
});

const siteCategoriesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "site-categories",
});
const siteCategoriesListRoute = createRoute({
  getParentRoute: () => siteCategoriesRoute,
  path: "/",
  component: SiteCategoryListPage,
});
const siteCategoriesAddRoute = createRoute({
  getParentRoute: () => siteCategoriesRoute,
  path: "add",
  component: SiteCategoryAddPage,
});
const siteCategoriesEntityRoute = createRoute({
  getParentRoute: () => siteCategoriesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: Number(params.id) };
    const queryRef = preloadQuery(SiteCategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SiteCategoryDocument, variables })
        ?.findSiteCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading sitecategory" />
  ),
  notFoundComponent: () => <ErrorMessage error="SiteCategory not found." />,
  component: Outlet,
});
const siteCategoriesEditRoute = createRoute({
  getParentRoute: () => siteCategoriesEntityRoute,
  path: "edit",
  component: () => <SiteCategoryEditPage from="/narrow/site-categories/$id" />,
});
const siteCategoriesDetailRoute = createRoute({
  getParentRoute: () => siteCategoriesEntityRoute,
  path: "/",
  component: () => (
    <SiteCategoryDetailPage from="/narrow/site-categories/$id" />
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "users",
});
const usersListRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "/",
  component: UserListPage,
});
const usersAddRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "add",
  component: UserAddPage,
});
const usersChangePasswordRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "change-password",
  component: UserChangePasswordPage,
});
const usersFingerprintsRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "fingerprints",
  component: UserFingerprintsPage,
});
const usersEntityRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "$name",
  loader: async ({ context: { client, preloadQuery, user }, params }) => {
    const variables = { name: params.name };
    const privateProfile = isAdmin(user) || user?.name === params.name;
    const queryRef = privateProfile
      ? preloadQuery(UserDocument, { variables })
      : preloadQuery(PublicUserDocument, { variables });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({
        query: privateProfile ? UserDocument : PublicUserDocument,
        variables,
      })?.findUser,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton label="Loading user" />,
  notFoundComponent: () => <ErrorMessage error="User not found." />,
  component: Outlet,
});
const usersDetailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "/",
  component: () => <UserDetailPage from="/narrow/users/$name" />,
});
const usersEditRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "edit",
  component: () => <UserEditPage from="/narrow/users/$name" />,
});
const usersEditsRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "edits",
  component: () => <UserEditsPage from="/narrow/users/$name" />,
});
const usersConfirmEmailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "confirm-email",
  component: () => <UserConfirmEmailPage from="/narrow/users/$name" />,
});
const usersChangeEmailRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "change-email",
  component: () => <UserChangeEmailPage from="/narrow/users/$name" />,
});
const usersImageTypesRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "image-types",
  component: () => <UserImageTypesPage from="/narrow/users/$name" />,
});
const usersNotificationsRoute = createRoute({
  getParentRoute: () => usersEntityRoute,
  path: "notifications",
  component: () => <UserNotificationsPage from="/narrow/users/$name" />,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "categories",
});
const adminCategoriesListRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "/",
  component: CategoryListPage,
});
const adminCategoriesAddRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "add",
  component: CategoryAddPage,
});
const adminCategoriesEntityRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(CategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: CategoryDocument, variables })?.findTagCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading category" />
  ),
  notFoundComponent: () => <ErrorMessage error="Category not found." />,
  component: Outlet,
});
const adminCategoriesEditRoute = createRoute({
  getParentRoute: () => adminCategoriesEntityRoute,
  path: "edit",
  component: () => <CategoryEditPage from="/narrow/admin/categories/$id" />,
});
const adminCategoriesDetailRoute = createRoute({
  getParentRoute: () => adminCategoriesEntityRoute,
  path: "/",
  component: () => <CategoryDetailPage from="/narrow/admin/categories/$id" />,
});

const adminSitesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "sites",
});
const adminSitesListRoute = createRoute({
  getParentRoute: () => adminSitesRoute,
  path: "/",
  component: SiteListPage,
});
const adminSitesAddRoute = createRoute({
  getParentRoute: () => adminSitesRoute,
  path: "add",
  component: SiteAddPage,
});
const adminSitesEntityRoute = createRoute({
  getParentRoute: () => adminSitesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(SiteDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SiteDocument, variables })?.findSite,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading site" />,
  notFoundComponent: () => <ErrorMessage error="Site not found." />,
  component: Outlet,
});
const adminSitesEditRoute = createRoute({
  getParentRoute: () => adminSitesEntityRoute,
  path: "edit",
  component: () => <SiteEditPage from="/narrow/admin/sites/$id" />,
});
const adminSitesDetailRoute = createRoute({
  getParentRoute: () => adminSitesEntityRoute,
  path: "/",
  component: () => <SiteDetailPage from="/narrow/admin/sites/$id" />,
});

const adminSiteCategoriesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "site-categories",
});
const adminSiteCategoriesListRoute = createRoute({
  getParentRoute: () => adminSiteCategoriesRoute,
  path: "/",
  component: SiteCategoryListPage,
});
const adminSiteCategoriesAddRoute = createRoute({
  getParentRoute: () => adminSiteCategoriesRoute,
  path: "add",
  component: SiteCategoryAddPage,
});
const adminSiteCategoriesEntityRoute = createRoute({
  getParentRoute: () => adminSiteCategoriesRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: Number(params.id) };
    const queryRef = preloadQuery(SiteCategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SiteCategoryDocument, variables })
        ?.findSiteCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading sitecategory" />
  ),
  notFoundComponent: () => <ErrorMessage error="SiteCategory not found." />,
  component: Outlet,
});
const adminSiteCategoriesEditRoute = createRoute({
  getParentRoute: () => adminSiteCategoriesEntityRoute,
  path: "edit",
  component: () => (
    <SiteCategoryEditPage from="/narrow/admin/site-categories/$id" />
  ),
});
const adminSiteCategoriesDetailRoute = createRoute({
  getParentRoute: () => adminSiteCategoriesEntityRoute,
  path: "/",
  component: () => (
    <SiteCategoryDetailPage from="/narrow/admin/site-categories/$id" />
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "users",
});
const adminUsersListRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "/",
  component: UserListPage,
});
const adminUsersAddRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "add",
  component: UserAddPage,
});
const adminUsersChangePasswordRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "change-password",
  component: UserChangePasswordPage,
});
const adminUsersFingerprintsRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "fingerprints",
  component: UserFingerprintsPage,
});
const adminUsersEntityRoute = createRoute({
  getParentRoute: () => adminUsersRoute,
  path: "$name",
  loader: async ({ context: { client, preloadQuery, user }, params }) => {
    const variables = { name: params.name };
    const privateProfile = isAdmin(user) || user?.name === params.name;
    const queryRef = privateProfile
      ? preloadQuery(UserDocument, { variables })
      : preloadQuery(PublicUserDocument, { variables });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({
        query: privateProfile ? UserDocument : PublicUserDocument,
        variables,
      })?.findUser,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton label="Loading user" />,
  notFoundComponent: () => <ErrorMessage error="User not found." />,
  component: Outlet,
});
const adminUsersDetailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "/",
  component: () => <UserDetailPage from="/narrow/admin/users/$name" />,
});
const adminUsersEditRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "edit",
  component: () => <UserEditPage from="/narrow/admin/users/$name" />,
});
const adminUsersEditsRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "edits",
  component: () => <UserEditsPage from="/narrow/admin/users/$name" />,
});
const adminUsersConfirmEmailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "confirm-email",
  component: () => <UserConfirmEmailPage from="/narrow/admin/users/$name" />,
});
const adminUsersChangeEmailRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "change-email",
  component: () => <UserChangeEmailPage from="/narrow/admin/users/$name" />,
});
const adminUsersImageTypesRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "image-types",
  component: () => <UserImageTypesPage from="/narrow/admin/users/$name" />,
});
const adminUsersNotificationsRoute = createRoute({
  getParentRoute: () => adminUsersEntityRoute,
  path: "notifications",
  component: () => <UserNotificationsPage from="/narrow/admin/users/$name" />,
});

const draftsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "drafts",
});
const draftsListRoute = createRoute({
  getParentRoute: () => draftsRoute,
  path: "/",
  component: DraftListPage,
});
const draftsDetailRoute = createRoute({
  getParentRoute: () => draftsRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(DraftDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: DraftDocument, variables })?.findDraft,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading draft" />,
  notFoundComponent: () => <ErrorMessage error="Draft not found." />,
  component: DraftDetailPage,
});

const editsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "edits",
});
const editsListRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "/",
  component: EditListPage,
});
const editsUpdateRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id/update",
  component: EditUpdatePage,
});
const editsAmendRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id/amend",
  component: EditAmendPage,
});
const editsDetailRoute = createRoute({
  getParentRoute: () => editsRoute,
  path: "$id",
  component: EditDetailPage,
});

const auditsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "audits",
});
const auditsListRoute = createRoute({
  getParentRoute: () => auditsRoute,
  path: "/",
  component: AuditListPage,
});

const imageReviewRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "image-review",
});
const imageReviewIndexRoute = createRoute({
  getParentRoute: () => imageReviewRoute,
  path: "/",
  component: ImageReviewPage,
});

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
const loginRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "login",
  component: Login,
});
const activateRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "activate",
  component: ActivateUser,
});
const registerRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "register",
  component: RegisterUser,
});
const forgotPasswordRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "forgot-password",
  component: ForgotPassword,
});
const resetPasswordRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "reset-password",
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
  component: Notifications,
});

export const routeTree = rootRoute.addChildren([
  homeRoute,
  narrowRoute.addChildren([
    performersRoute.addChildren([
      performersListRoute,
      performersAddRoute,
      performersEntityRoute.addChildren([
        performersMergeRoute,
        performersDeleteRoute,
        performersEditRoute,
        performersDetailRoute,
      ]),
    ]),
    scenesRoute.addChildren([
      scenesAddRoute,
      scenesListRoute,
      scenesEntityRoute.addChildren([
        scenesDeleteRoute,
        scenesEditRoute,
        scenesFingerprintsRoute,
        scenesDetailRoute,
      ]),
    ]),
    studiosRoute.addChildren([
      studiosAddRoute,
      studiosListRoute,
      studiosEntityRoute.addChildren([
        studiosDeleteRoute,
        studiosEditRoute,
        studiosDetailRoute,
      ]),
    ]),
    tagsRoute.addChildren([
      tagsListRoute,
      tagsAddRoute,
      tagsEntityRoute.addChildren([
        tagsMergeRoute,
        tagsDeleteRoute,
        tagsEditRoute,
        tagsDetailRoute,
      ]),
    ]),
    categoriesRoute.addChildren([
      categoriesListRoute,
      categoriesAddRoute,
      categoriesEntityRoute.addChildren([
        categoriesEditRoute,
        categoriesDetailRoute,
      ]),
    ]),
    sitesRoute.addChildren([
      sitesListRoute,
      sitesAddRoute,
      sitesEntityRoute.addChildren([sitesEditRoute, sitesDetailRoute]),
    ]),
    siteCategoriesRoute.addChildren([
      siteCategoriesListRoute,
      siteCategoriesAddRoute,
      siteCategoriesEntityRoute.addChildren([
        siteCategoriesEditRoute,
        siteCategoriesDetailRoute,
      ]),
    ]),
    usersRoute.addChildren([
      usersListRoute,
      usersAddRoute,
      usersChangePasswordRoute,
      usersFingerprintsRoute,
      usersEntityRoute.addChildren([
        usersDetailRoute,
        usersEditRoute,
        usersEditsRoute,
        usersConfirmEmailRoute,
        usersChangeEmailRoute,
        usersImageTypesRoute,
        usersNotificationsRoute,
      ]),
    ]),
    draftsRoute.addChildren([draftsListRoute, draftsDetailRoute]),
    editsRoute.addChildren([
      editsListRoute,
      editsUpdateRoute,
      editsAmendRoute,
      editsDetailRoute,
    ]),
    imageReviewRoute.addChildren([imageReviewIndexRoute]),
    searchRoute.addChildren([
      searchAllRoute,
      searchPerformersRoute,
      searchScenesRoute,
    ]),
    loginRoute,
    activateRoute,
    registerRoute,
    forgotPasswordRoute,
    resetPasswordRoute,
    versionRoute,
    imageRoute,
    imageEditRoute,
    notificationsRoute,
    adminRoute.addChildren([
      adminOverviewRoute,
      imageTypesRoute,
      adminCategoriesRoute.addChildren([
        adminCategoriesListRoute,
        adminCategoriesAddRoute,
        adminCategoriesEntityRoute.addChildren([
          adminCategoriesEditRoute,
          adminCategoriesDetailRoute,
        ]),
      ]),
      adminSitesRoute.addChildren([
        adminSitesListRoute,
        adminSitesAddRoute,
        adminSitesEntityRoute.addChildren([
          adminSitesEditRoute,
          adminSitesDetailRoute,
        ]),
      ]),
      adminSiteCategoriesRoute.addChildren([
        adminSiteCategoriesListRoute,
        adminSiteCategoriesAddRoute,
        adminSiteCategoriesEntityRoute.addChildren([
          adminSiteCategoriesEditRoute,
          adminSiteCategoriesDetailRoute,
        ]),
      ]),
      adminUsersRoute.addChildren([
        adminUsersListRoute,
        adminUsersAddRoute,
        adminUsersChangePasswordRoute,
        adminUsersFingerprintsRoute,
        adminUsersEntityRoute.addChildren([
          adminUsersDetailRoute,
          adminUsersEditRoute,
          adminUsersEditsRoute,
          adminUsersConfirmEmailRoute,
          adminUsersChangeEmailRoute,
          adminUsersImageTypesRoute,
          adminUsersNotificationsRoute,
        ]),
      ]),
      auditsRoute.addChildren([auditsListRoute]),
    ]),
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
    // Apollo owns the cache; don't retain route matches with disposed query refs.
    defaultPreloadStaleTime: 0,
    defaultGcTime: 0,
    defaultPendingMs: 150,
    defaultPendingMinMs: 200,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
