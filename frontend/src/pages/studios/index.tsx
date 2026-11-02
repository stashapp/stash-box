import { useReadQuery } from "@apollo/client/react";
import { createRoute, getRouteApi, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { StudioDocument } from "src/graphql";
import { narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";

import Studio from "./Studio";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";
import StudioEdit from "./StudioEdit";
import Studios from "./Studios";

const routeApi = getRouteApi("/narrow/studios/$id");

export const StudioDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Delete "${studio.name}"`} />
      <StudioDelete studio={studio} />
    </>
  );
};

export const StudioEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Edit "${studio.name}"`} />
      <StudioEdit studio={studio} />
    </>
  );
};

export const StudioDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={studio.name} />
      <Studio studio={studio} />
    </>
  );
};

export const StudioAddPage: FC = () => (
  <>
    <Title page="Add Studio" />
    <StudioAdd />
  </>
);

export const StudioListPage: FC = () => (
  <>
    <Title page="Studios" />
    <Studios />
  </>
);

export default StudioDetailPage;

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

export const studioRoutes = studiosRoute.addChildren([
  studiosAddRoute,
  studiosListRoute,
  studiosEntityRoute.addChildren([
    studiosDeleteRoute,
    studiosEditRoute,
    studiosDetailRoute,
  ]),
]);
