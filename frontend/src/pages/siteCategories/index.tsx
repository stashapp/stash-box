import { useReadQuery } from "@apollo/client/react";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { SiteCategoryDocument } from "src/graphql";
import { adminRoute, narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";

import SiteCategories from "./SiteCategories";
import SiteCategory from "./SiteCategory";
import SiteCategoryAdd from "./SiteCategoryAdd";
import SiteCategoryEdit from "./SiteCategoryEdit";

interface SiteCategoryPageProps {
  from: "/narrow/site-categories/$id" | "/narrow/admin/site-categories/$id";
}

export const SiteCategoryEditPage: FC<SiteCategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findSiteCategory);

  return (
    <>
      <Title page={`Edit Site Category "${category.name}"`} />
      <SiteCategoryEdit category={category} />
    </>
  );
};

export const SiteCategoryDetailPage: FC<SiteCategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findSiteCategory);

  return (
    <>
      <Title page={`Site Category "${category.name}"`} />
      <SiteCategory category={category} />
    </>
  );
};

export const SiteCategoryListPage: FC = () => (
  <>
    <Title page="Site Categories" />
    <SiteCategories />
  </>
);

export const SiteCategoryAddPage: FC = () => (
  <>
    <Title page="Add Site Category" />
    <SiteCategoryAdd />
  </>
);

export default SiteCategoryDetailPage;

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

export const siteCategoryRoutes = siteCategoriesRoute.addChildren([
  siteCategoriesListRoute,
  siteCategoriesAddRoute,
  siteCategoriesEntityRoute.addChildren([
    siteCategoriesEditRoute,
    siteCategoriesDetailRoute,
  ]),
]);

export const adminSiteCategoryRoutes = adminSiteCategoriesRoute.addChildren([
  adminSiteCategoriesListRoute,
  adminSiteCategoriesAddRoute,
  adminSiteCategoriesEntityRoute.addChildren([
    adminSiteCategoriesEditRoute,
    adminSiteCategoriesDetailRoute,
  ]),
]);
