import { useReadQuery } from "@apollo/client/react";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { SiteDocument } from "src/graphql";
import { adminRoute, narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";

import Site from "./Site";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";
import Sites from "./Sites";

interface SitePageProps {
  from: "/narrow/sites/$id" | "/narrow/admin/sites/$id";
}

export const SiteEditPage: FC<SitePageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);

  return (
    <>
      <Title page={`Edit Site "${site.name}"`} />
      <SiteEdit site={site} />
    </>
  );
};

export const SiteDetailPage: FC<SitePageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);

  return (
    <>
      <Title page={`Site "${site.name}"`} />
      <Site site={site} />
    </>
  );
};

export const SiteListPage: FC = () => (
  <>
    <Title page="Sites" />
    <Sites />
  </>
);

export const SiteAddPage: FC = () => (
  <>
    <Title page="Add Site" />
    <SiteAdd />
  </>
);

export default SiteDetailPage;

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

export const siteRoutes = sitesRoute.addChildren([
  sitesListRoute,
  sitesAddRoute,
  sitesEntityRoute.addChildren([sitesEditRoute, sitesDetailRoute]),
]);

export const adminSiteRoutes = adminSitesRoute.addChildren([
  adminSitesListRoute,
  adminSitesAddRoute,
  adminSitesEntityRoute.addChildren([
    adminSitesEditRoute,
    adminSitesDetailRoute,
  ]),
]);
